/**
 * Nebius Token Factory Automated Fine-Tuning Script
 *
 * Uploads `dataset/nebius_sft_train.jsonl` to Nebius Token Factory
 * and initiates a Fine-Tuning job on an NVIDIA open-source model.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TRAIN_DATASET = path.join(ROOT_DIR, 'dataset', 'nebius_sft_train.jsonl');

async function run() {
  const apiKey = process.env.NEBIUS_API_KEY;

  console.log('=====================================================');
  console.log('   Nebius Token Factory Fine-Tuning Launchpad');
  console.log('=====================================================');

  if (!fs.existsSync(TRAIN_DATASET)) {
    console.error('❌ Error: Training dataset not found. Run `npm run build:dataset` first.');
    process.exit(1);
  }

  const fileStats = fs.statSync(TRAIN_DATASET);
  const sampleCount = fs.readFileSync(TRAIN_DATASET, 'utf-8').trim().split('\n').length;
  console.log(`📦 Dataset Ready: ${TRAIN_DATASET}`);
  console.log(`📊 Size: ${(fileStats.size / 1024).toFixed(1)} KB | Samples: ${sampleCount}`);

  if (!apiKey || !apiKey.trim()) {
    console.log('\n💡 [How to Launch Fine-Tuning on Nebius]:');
    console.log('1. Register on Nebius Token Factory / Nebius AI Cloud (via hackathon link).');
    console.log('2. Copy your API Key and run:');
    console.log('   export NEBIUS_API_KEY="your-api-key"');
    console.log('   node scripts/nebius_finetune.mjs');
    console.log('\nOr upload dataset/nebius_sft_train.jsonl directly to the Nebius Fine-Tuning UI:');
    console.log('   Model: meta-llama/Llama-3.1-8B-Instruct or nvidia/Llama-3.1-Nemotron');
    console.log('   Method: LoRA SFT');
    console.log('=====================================================');
    return;
  }

  console.log('🚀 Connecting to Nebius Token Factory API...');
  try {
    // 1. Upload dataset file
    console.log('⏳ Uploading training dataset...');
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(TRAIN_DATASET)], { type: 'application/jsonl' });
    formData.append('file', blob, 'nebius_sft_train.jsonl');
    formData.append('purpose', 'fine-tune');

    const fileRes = await fetch('https://api.tokenfactory.nebius.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: formData,
    });

    if (!fileRes.ok) {
      const err = await fileRes.text();
      throw new Error(`Failed to upload file to Nebius: ${fileRes.status} ${err}`);
    }

    const fileData = await fileRes.json();
    console.log(`✅ File uploaded successfully! File ID: ${fileData.id}`);

    // 2. Launch Fine-Tuning Job
    console.log('⏳ Creating Fine-Tuning Job...');
    const jobRes = await fetch('https://api.tokenfactory.nebius.com/v1/fine_tuning/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        training_file: fileData.id,
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        hyperparameters: {
          n_epochs: 3,
        },
      }),
    });

    if (!jobRes.ok) {
      const err = await jobRes.text();
      throw new Error(`Failed to create fine-tuning job: ${jobRes.status} ${err}`);
    }

    const jobData = await jobRes.json();
    console.log('🎉 Fine-tuning job created successfully!');
    console.log(`- Job ID: ${jobData.id}`);
    console.log(`- Base Model: ${jobData.model}`);
    console.log(`- Status: ${jobData.status}`);
    console.log('\nAdd your fine-tuned model ID to .env when training completes:');
    console.log(`NEBIUS_LORA_MODEL_ID="${jobData.fine_tuned_model || jobData.id}"`);
  } catch (err) {
    console.error('❌ Nebius API error:', err.message);
  }
}

run();

