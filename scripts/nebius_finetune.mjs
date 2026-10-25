/**
 * Nebius Token Factory Automated Fine-Tuning Script
 *
 * Uploads `dataset/nebius_sft_train.jsonl` to Nebius Token Factory
 * and initiates a Fine-Tuning job on an open-source model.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TRAIN_DATASET = path.join(ROOT_DIR, 'dataset', 'nebius_sft_train.jsonl');
const VAL_DATASET = path.join(ROOT_DIR, 'dataset', 'nebius_sft_val.jsonl');
const ENV_FILE = path.join(ROOT_DIR, '.env');

function getApiKey() {
  if (process.env.NEBIUS_API_KEY && process.env.NEBIUS_API_KEY.trim()) {
    return process.env.NEBIUS_API_KEY.trim();
  }
  if (fs.existsSync(ENV_FILE)) {
    const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('NEBIUS_API_KEY=')) {
        return trimmed.replace('NEBIUS_API_KEY=', '').trim();
      }
      if (trimmed.startsWith('VITE_NEBIUS_API_KEY=')) {
        return trimmed.replace('VITE_NEBIUS_API_KEY=', '').trim();
      }
    }
  }
  return '';
}

async function run() {
  const apiKey = getApiKey();

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

  if (!apiKey) {
    console.log('\n❌ NEBIUS_API_KEY not found in environment or .env.');
    return;
  }

  console.log('🚀 Connecting to Nebius Token Factory API...');
  try {
    // 1. Upload dataset file
    console.log('⏳ Uploading training dataset to Nebius...');
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(TRAIN_DATASET)], { type: 'application/jsonl' });
    formData.append('file', blob, 'nebius_sft_train.jsonl');
    formData.append('purpose', 'fine-tune');

    const fileRes = await fetch('https://api.tokenfactory.nebius.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!fileRes.ok) {
      const err = await fileRes.text();
      throw new Error(`Failed to upload file to Nebius: ${fileRes.status} ${err}`);
    }

    const fileData = await fileRes.json();
    console.log(`✅ Training file uploaded successfully! File ID: ${fileData.id}`);

    // Optional: upload validation file
    let valFileId = null;
    if (fs.existsSync(VAL_DATASET)) {
      console.log('⏳ Uploading validation dataset to Nebius...');
      const valFormData = new FormData();
      const valBlob = new Blob([fs.readFileSync(VAL_DATASET)], { type: 'application/jsonl' });
      valFormData.append('file', valBlob, 'nebius_sft_val.jsonl');
      valFormData.append('purpose', 'fine-tune');

      const valRes = await fetch('https://api.tokenfactory.nebius.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: valFormData,
      });

      if (valRes.ok) {
        const valData = await valRes.json();
        valFileId = valData.id;
        console.log(`✅ Validation file uploaded successfully! File ID: ${valFileId}`);
      }
    }

    // 2. Discover supported fine-tuning models
    console.log('🔍 Checking available fine-tuning models...');
    const modelsRes = await fetch('https://api.tokenfactory.nebius.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const modelsData = await modelsRes.json();
    const modelIds = (modelsData.data || []).map((m) => m.id);
    console.log(`Found ${modelIds.length} models on Nebius Token Factory.`);

    // Choose target base model
    const preferredModel =
      modelIds.find((id) => id.includes('Nemotron') && !id.includes('Embedding')) ||
      modelIds.find((id) => id.includes('Llama-3.1-8B')) ||
      modelIds.find((id) => id.includes('Qwen3-30B')) ||
      'meta-llama/Llama-3.1-8B-Instruct';

    console.log(`Selected Base Model for Fine-Tuning: ${preferredModel}`);

    // 3. Launch Fine-Tuning Job
    console.log('⏳ Creating Fine-Tuning Job on Nebius Token Factory...');
    const jobPayload = {
      training_file: fileData.id,
      model: preferredModel,
      hyperparameters: {
        n_epochs: 3,
      },
    };
    if (valFileId) {
      jobPayload.validation_file = valFileId;
    }

    const jobRes = await fetch('https://api.tokenfactory.nebius.com/v1/fine_tuning/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(jobPayload),
    });

    if (!jobRes.ok) {
      const err = await jobRes.text();
      console.warn(`Note: Fine-tuning job creation returned ${jobRes.status}: ${err}`);
      console.log('💡 Note: Nebius Token Factory fine-tuning access can also be managed via Nebius Web Console Post-Training tab.');
    } else {
      const jobData = await jobRes.json();
      console.log('🎉 Fine-tuning job created successfully!');
      console.log(`- Job ID: ${jobData.id}`);
      console.log(`- Base Model: ${jobData.model}`);
      console.log(`- Status: ${jobData.status}`);

      // Persist job info
      const jobRecordPath = path.join(ROOT_DIR, 'dataset', 'nebius_job.json');
      fs.writeFileSync(jobRecordPath, JSON.stringify(jobData, null, 2), 'utf-8');
      console.log(`Saved job record to ${jobRecordPath}`);
    }
  } catch (err) {
    console.error('❌ Nebius API error:', err.message);
  }
}

run();
