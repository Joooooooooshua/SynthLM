"""
SynthNet-16H: PyTorch Neural Inverse Acoustic Synthesizer
Trained on synthetic harmonic wavetables and acoustic parameter spaces.
Maps 36-dimensional spectral/temporal features -> 16 Fourier harmonics + ADSR & Filter parameters.
Exports compact weights to src/audio/neuralSpectralWeights.json for browser-native inference.
"""

import os
import json
import math
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

# 1. Device selection (Apple Silicon MPS / CUDA / CPU)
if torch.backends.mps.is_available():
    device = torch.device("mps")
elif torch.cuda.is_available():
    device = torch.device("cuda")
else:
    device = torch.device("cpu")

print(f"⚡ Training SynthNet-16H on device: {device}")

# 2. Synthetic Dataset Generation
def generate_synthetic_acoustic_data(num_samples=10000):
    np.random.seed(42)
    torch.manual_seed(42)

    # Output Targets:
    # 16 Fourier harmonics [-1.0, 1.0]
    # 7 Physical DSP params: [cutoff_norm, res_norm, flt_env_norm, attack_norm, decay_norm, sustain_norm, release_norm]
    
    Y_harmonics = np.zeros((num_samples, 16), dtype=np.float32)
    Y_params = np.zeros((num_samples, 7), dtype=np.float32)
    X_features = np.zeros((num_samples, 36), dtype=np.float32)

    for i in range(num_samples):
        # Sample mode: 0 = Pure/Harmonic, 1 = Formant/Vowel, 2 = Random Sculpted
        mode = i % 3
        if mode == 0:
            # Natural acoustic decay (1/k or 1/k^2)
            alpha = np.random.uniform(0.7, 2.2)
            partials = np.array([1.0 / (k ** alpha) for k in range(1, 17)])
            partials *= np.random.choice([1, -1], size=16, p=[0.7, 0.3])
            partials[0] = 1.0
        elif mode == 1:
            # Formant peaks
            partials = np.zeros(16)
            partials[0] = 1.0
            peak1 = np.random.randint(2, 6)
            peak2 = np.random.randint(6, 12)
            partials[peak1] = np.random.uniform(0.4, 0.9)
            partials[peak2] = np.random.uniform(0.2, 0.6)
            partials += np.random.normal(0, 0.05, 16)
        else:
            # Sparse high-harmonic or glassy chime
            partials = np.random.uniform(-0.8, 0.8, 16)
            mask = np.random.uniform(0, 1, 16) > 0.4
            partials *= mask
            partials[0] = np.random.uniform(0.6, 1.0)

        # Normalize max magnitude
        max_val = np.max(np.abs(partials))
        if max_val > 1e-4:
            partials = partials / max_val
        Y_harmonics[i] = partials

        # Normalized DSP parameters [0, 1]
        cutoff_norm = np.random.beta(2, 2)
        res_norm = np.random.beta(1.5, 3)
        flt_env_norm = np.random.uniform(0.1, 0.9)
        att_norm = np.random.beta(1, 3) # more fast attacks
        dec_norm = np.random.beta(2, 2)
        sus_norm = np.random.uniform(0.0, 1.0)
        rel_norm = np.random.beta(2, 2)
        Y_params[i] = [cutoff_norm, res_norm, flt_env_norm, att_norm, dec_norm, sus_norm, rel_norm]

        # Synthesize 36-dimensional input feature vector (Spectral + Envelope)
        # 16 normalized spectral harmonic bins
        spec_bins = np.abs(partials) + np.random.normal(0, 0.02, 16)
        spec_bins = np.clip(spec_bins, 0, 1.2)
        
        # 4 Global Spectral descriptors
        k_indices = np.arange(1, 17)
        spectral_centroid = np.sum(k_indices * spec_bins) / (np.sum(spec_bins) + 1e-6) / 16.0
        spectral_rolloff = (cutoff_norm * 0.8) + (spectral_centroid * 0.2)
        spectral_flatness = float(np.mean(spec_bins) / (np.max(spec_bins) + 1e-6))
        zero_crossings = float(spectral_centroid * 0.7 + np.random.normal(0, 0.02))

        # 16-frame temporal envelope contour (simulating WebAudio ADSR trace)
        env_frames = np.zeros(16)
        # Attack phase
        att_idx = max(1, int(att_norm * 5))
        env_frames[:att_idx] = np.linspace(0, 1.0, att_idx)
        # Decay phase to sustain
        dec_idx = max(att_idx + 1, min(12, att_idx + int(dec_norm * 6)))
        env_frames[att_idx:dec_idx] = np.linspace(1.0, sus_norm, dec_idx - att_idx)
        # Sustain & Release
        env_frames[dec_idx:] = np.linspace(sus_norm, max(0.0, sus_norm * (1.0 - rel_norm)), 16 - dec_idx)

        # Assemble 36 features: 16 harmonics + 4 spectral + 16 temporal envelope
        X_features[i, :16] = spec_bins
        X_features[i, 16:20] = [spectral_centroid, spectral_rolloff, spectral_flatness, zero_crossings]
        X_features[i, 20:36] = env_frames

    return (
        torch.tensor(X_features, dtype=torch.float32),
        torch.tensor(Y_harmonics, dtype=torch.float32),
        torch.tensor(Y_params, dtype=torch.float32)
    )

# 3. Residual MLP Architecture
class SynthNet16H(nn.Module):
    def __init__(self, in_features=36, hidden_dim=128):
        super().__init__()
        self.input_layer = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
        )
        self.res_block = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
        )
        self.act = nn.SiLU()
        self.bottleneck = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.LayerNorm(64),
            nn.SiLU()
        )
        
        # Dual Heads
        self.head_harmonics = nn.Sequential(
            nn.Linear(64, 16),
            nn.Tanh() # 16 Fourier partials in [-1.0, 1.0]
        )
        self.head_params = nn.Sequential(
            nn.Linear(64, 7),
            nn.Sigmoid() # 7 normalized DSP parameters in [0.0, 1.0]
        )

    def forward(self, x):
        h = self.input_layer(x)
        h = self.act(h + self.res_block(h))
        b = self.bottleneck(h)
        harmonics = self.head_harmonics(b)
        params = self.head_params(b)
        return harmonics, params

# 4. Training Loop
def train():
    num_samples = 12000
    X, Y_harm, Y_param = generate_synthetic_acoustic_data(num_samples)

    train_split = int(num_samples * 0.85)
    X_train, X_val = X[:train_split].to(device), X[train_split:].to(device)
    Y_harm_train, Y_harm_val = Y_harm[:train_split].to(device), Y_harm[train_split:].to(device)
    Y_param_train, Y_param_val = Y_param[:train_split].to(device), Y_param[train_split:].to(device)

    model = SynthNet16H().to(device)
    optimizer = optim.AdamW(model.parameters(), lr=3e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=35)
    
    mse_loss = nn.MSELoss()
    huber_loss = nn.SmoothL1Loss()
    cos_loss = nn.CosineSimilarity(dim=1)

    batch_size = 128
    num_epochs = 35
    metrics = {"epochs": [], "final_val_loss": 0, "final_cos_sim": 0}

    print(f"🚀 Training SynthNet-16H on {train_split} samples (Batch Size: {batch_size})...")

    for epoch in range(1, num_epochs + 1):
        model.train()
        permutation = torch.randperm(train_split)
        train_loss = 0.0

        for b_start in range(0, train_split, batch_size):
            indices = permutation[b_start:b_start + batch_size]
            b_x = X_train[indices]
            b_harm = Y_harm_train[indices]
            b_param = Y_param_train[indices]

            optimizer.zero_grad()
            pred_harm, pred_param = model(b_x)

            # Combined loss: Harmonic MSE + (1 - CosineSimilarity) + Parameter Huber Loss
            l_harm_mse = mse_loss(pred_harm, b_harm)
            l_harm_cos = (1.0 - cos_loss(pred_harm, b_harm)).mean()
            l_param = huber_loss(pred_param, b_param)
            total_loss = l_harm_mse + 0.5 * l_harm_cos + 1.2 * l_param

            total_loss.backward()
            optimizer.step()
            train_loss += total_loss.item() * len(indices)

        scheduler.step()
        train_loss /= train_split

        # Validation
        model.eval()
        with torch.no_grad():
            val_harm, val_param = model(X_val)
            val_harm_mse = mse_loss(val_harm, Y_harm_val)
            val_harm_cos = cos_loss(val_harm, Y_harm_val).mean().item()
            val_param_l = huber_loss(val_param, Y_param_val)
            val_total = val_harm_mse + 0.5 * (1.0 - val_harm_cos) + 1.2 * val_param_l

        if epoch % 5 == 0 or epoch == num_epochs:
            print(f"Epoch {epoch:2d}/{num_epochs:2d} | Train: {train_loss:.4f} | Val: {val_total:.4f} | Fourier CosSim: {val_harm_cos:.4f}")

        metrics["epochs"].append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_total.item(), 4),
            "fourier_cos_sim": round(val_harm_cos, 4)
        })

    metrics["final_val_loss"] = metrics["epochs"][-1]["val_loss"]
    metrics["final_cos_sim"] = metrics["epochs"][-1]["fourier_cos_sim"]

    # 5. Export JSON weights for zero-dependency Browser WebAudio forward pass
    print("📦 Exporting SynthNet-16H neural weights to JSON for browser inference...")
    model.eval()
    cpu_model = model.cpu()

    weights_dict = {}
    for name, param in cpu_model.named_parameters():
        weights_dict[name] = param.detach().numpy().tolist()

    # Save metrics and weights
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    
    metrics_path = os.path.join(script_dir, "synthnet_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    export_path = os.path.join(root_dir, "src", "audio", "neuralSpectralWeights.json")
    with open(export_path, "w") as f:
        json.dump(weights_dict, f)

    file_size_kb = os.path.getsize(export_path) / 1024
    print(f"✅ Success! Trained SynthNet-16H exported to:")
    print(f"  - Weights: {export_path} ({file_size_kb:.1f} KB)")
    print(f"  - Metrics: {metrics_path} (Final Cosine Sim: {metrics['final_cos_sim']})")

if __name__ == "__main__":
    train()
