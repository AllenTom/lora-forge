import { Recommendation, TrainParameter, TrainParams, ValidateRule } from '../../../types';
import { TFunction } from 'i18next';
export const defaultSamplers = [
  "ddim",
  "pndm",
  "lms",
  "euler",
  "euler_a",
  "heun",
  "dpm_2",
  "dpm_2_a",
  "dpmsolver",
  "dpmsolver++",
  "dpmsingle",
  "k_lms",
  "k_euler",
  "k_euler_a",
  "k_dpm_2",
  "k_dpm_2_a",
]
export const defaultParams: TrainParams =
  {
    'network_module': 'networks.lora',
    'save_model_as': 'safetensors',
    'train_batch_size': 1,
    'caption_extension': '.txt',
    'mixed_precision': 'fp16',
    'save_precision': 'fp16',
    'cache_latents': true,
    'seed': 1234,
    'learning_rate': 0.0001,
    'lr_scheduler': 'constant',
    'optimizer_type': 'AdamW8bit',
    'text_encoder_lr': 0.00005,
    'unet_lr': 0.0001,
    'network_dim': 128,
    'network_alpha': 128,
    'resolution': '512,512',
    'gradient_accumulation_steps': 1,
    'prior_loss_weight': 1,
    'lr_scheduler_num_cycles': 1,
    'lr_scheduler_power': 1,
    'clip_skip': 1,
    'max_token_length': 150,
    'xformers': true,
    'bucket_no_upscale': true,
    'bucket_reso_steps': 64,
    'vae_batch_size': 1,
    'max_data_loader_n_workers': 8,
    'sample_sampler': 'euler_a',
    'save_every_n_steps': 100
  };


export const getTrainParameterList = (t: TFunction): TrainParameter[] => {
  const mustNumber: ValidateRule = {
    name: 'MustNumber',
    validate: (value: any, values: any) => {
      return !isNaN(value);
    },
    messageRender: (value: any, values: any) => {
      return t('validate.mustBeNumber', {
        val: value
      });
    }
  };
  const valueRequired: ValidateRule = {
    name: 'ValueRequired',
    validate: (value: any, values: any) => {
      return value && value !== '';
    },
    messageRender: (value: any, values: any) => {
      return t('validate.isRequire');
    }
  };
  const resolutionRule: ValidateRule = {
    name: 'ResolutionRule',
    validate: (value: any, values: any) => {
      const pattern: RegExp = /^\d+,\d+$/;
      return pattern.test(value);
    },
    messageRender: (value: any, values: any) => {
      return t('validate.resolutionError');
    }

  };
  const createDividerRecom = (div: number): Recommendation => {
    return {
      name: `divider_${div}`,
      validate: (value: any, values: any) => {
        if (value && value !== '') {
          return value % div === 0;
        }
        return false;
      },
      messageRender: (value: any, values: any) => {
        return t('validate.recommendedDivisible', {
          val: value,
          div: div
        });
      }
    };
  };
  const createRangeRecom = (min: number, max: number): Recommendation => {
    return {
      name: `range_${min}_${max}`,
      validate: (value: any, values: any) => {
        if (value && value !== '') {
          return value >= min && value <= max;
        }
        return false;
      },
      messageRender: (value: any, values: any) => {
        return t('validate.recommendedRange', {
          val: value,
          min: min,
          max: max
        });
      }
    };
  };
  return [
    {
      name: 'network_module',
      type: 'string',
      description: t('args.network_module'),
      default: 'networks.lora'
    },
    {
      name: 'save_model_as',
      type: 'string',
      description: t('args.save_model_as'),
      default: 'safetensors',
      choices: ['ckpt', 'pt', 'safetensors']
    },
    {
      name: 'text_encoder_lr',
      type: 'number',
      description: t('args.text_encoder_lr'),
      default: 0.00005,
      validate: [
        mustNumber,
        valueRequired
      ]
    },
    {
      name: 'unet_lr',
      type: 'number',
      description: t('args.unet_lr'),
      default: 0.0001,
      validate: [
        mustNumber,
        valueRequired
      ]
    },
    {
      name: 'network_dim',
      type: 'number',
      description: t('args.network_dim'),
      default: 128,
      validate: [
        mustNumber,
        valueRequired
      ]
    },
    {
      name: 'network_alpha',
      type: 'number',
      description: t('args.network_alpha'),
      default: 128,
      validate: [
        mustNumber,
        valueRequired
      ]
    },
    {
      name: 'prior_loss_weight',
      type: 'number',
      description: t('args.prior_loss_weight'),
      default: 1,
      validate: [
        mustNumber,
        valueRequired
      ]
    },
    {
      name: 'bucket_reso_steps',
      type: 'number',
      description: t('args.bucket_reso_steps'),
      default: 64,
      validate: [
        mustNumber,
        valueRequired
      ],
      recommendation: [
        createDividerRecom(8)
      ]
    },
    {
      name: 'sample_sampler',
      type: 'string',
      description: t('args.sample_sampler'),
      default: 'euler_a',
      choices: [
        'ddim',
        'pndm',
        'lms',
        'euler',
        'euler_a',
        'heun',
        'dpm_2',
        'dpm_2_a',
        'dpmsolver',
        'dpmsolver++',
        'dpmsingle',
        'k_lms',
        'k_euler',
        'k_euler_a',
        'k_dpm_2',
        'k_dpm_2_a'
      ],
      validate: [
        valueRequired
      ]
    },
    // sp
    {
      name: 'v2',
      type: 'boolean',
      description: t('args.v2'),
      default: false,
      category: 'sd_models_arguments'
    },
    {
      name: 'v_parameterization',
      type: 'boolean',
      description: t('args.v_parameterization'),
      default: false,
      category: 'sd_models_arguments'
    },
    {
      name: 'tokenizer_cache_dir',
      type: 'folder',
      description: t('args.tokenizer_cache_dir'),
      default: '',
      category: 'sd_models_arguments'
    },
    {
      name: 'reg_data_dir',
      type: 'folder',
      description: t('args.reg_data_dir'),
      default: ''
    },
    {
      name: 'logging_dir',
      type: 'folder',
      description: t('args.logging_dir'),
      default: ''
    },
    {
      name: 'max_train_epochs',
      type: 'number',
      description: t('args.max_train_epochs'),
      default: ''
    },
    {
      name: 'save_every_n_epochs',
      type: 'number',
      description: t('args.save_every_n_epochs'),
      default: ''
    },
    {
      name: 'optimizer_type',
      type: 'string',
      description: t('args.optimizer_type'),
      default: 'AdamW8bit',
      category: 'optimizer_arguments',
      choices: [
        'AdamW',
        'AdamW8bit',
        'Adafactor',
        'DAdaptation',
        'Lion',
        'SGDNesterov',
        'SGDNesterov8bit'
      ]
    },
    {
      name: 'use_8bit_adam',
      type: 'boolean',
      description: t('args.use_8bit_adam'),
      default: false,
      category: 'optimizer_arguments'
    },
    {
      name: 'use_lion_optimizer',
      type: 'boolean',
      description: t('args.use_lion_optimizer'),
      default: false,
      category: 'optimizer_arguments'
    },
    {
      name: 'learning_rate',
      type: 'number',
      description: t('args.learning_rate'),
      default: 0.0001,
      category: 'optimizer_arguments',
      validate: [
        mustNumber,
        valueRequired
      ]
    },
    {
      name: 'max_grad_norm',
      type: 'number',
      description: t('args.max_grad_norm'),
      default: 1.0,
      category: 'optimizer_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'optimizer_args',
      type: 'string',
      description: t('args.optimizer_args'),
      default: null
    },
    {
      name: 'lr_scheduler_type',
      type: 'string',
      description: t('args.lr_scheduler_type'),
      default: ''
    },
    {
      name: 'lr_scheduler_args',
      type: 'string',
      description: t('args.lr_scheduler_args'),
      default: null
    },
    {
      name: 'lr_scheduler',
      type: 'string',
      description: t('args.lr_scheduler'),
      default: 'constant',
      choices: [
        'adafactor',
        'constant',
        'constant_with_warmup',
        'cosine',
        'cosine_with_restarts',
        'linear',
        'polynomial'
      ]
    },
    {
      name: 'lr_warmup_steps',
      type: 'integer',
      description: t('args.lr_warmup_steps'),
      default: 0
    },
    {
      name: 'lr_scheduler_num_cycles',
      type: 'integer',
      description: t('args.lr_scheduler_num_cycles'),
      default: 1
    },
    {
      name: 'lr_scheduler_power',
      type: 'float',
      description: t('args.lr_scheduler_power'),
      default: 1
    },
// train opts
    {
      name: 'huggingface_repo_id',
      type: 'string',
      description: t('args.huggingface_repo_id'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'huggingface_repo_type',
      type: 'string',
      description: t('args.huggingface_repo_type'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'huggingface_path_in_repo',
      type: 'string',
      description: t('args.huggingface_path_in_repo'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'huggingface_token',
      type: 'string',
      description: t('args.huggingface_token'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'huggingface_repo_visibility',
      type: 'string',
      description: t('args.huggingface_repo_visibility'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'save_state_to_huggingface',
      type: 'boolean',
      description: t('args.save_state_to_huggingface'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'resume_from_huggingface',
      type: 'boolean',
      description: t('args.resume_from_huggingface'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'async_upload',
      type: 'boolean',
      description: t('args.async_upload'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'save_precision',
      type: 'string',
      description: t('args.save_precision'),
      default: null,
      category: 'training_arguments',
      choices: ['float', 'fp16', 'bf16']
    },
    {
      name: 'save_every_n_epochs',
      type: 'integer',
      description: t('args.save_every_n_epochs'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'save_every_n_steps',
      type: 'integer',
      description: t('args.save_every_n_steps'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'save_n_epoch_ratio',
      type: 'integer',
      description: t('args.save_n_epoch_ratio'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'save_last_n_epochs',
      type: 'integer',
      description: t('args.save_last_n_epochs'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'save_last_n_epochs_state',
      type: 'integer',
      description: t('args.save_last_n_epochs_state'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'save_last_n_steps',
      type: 'integer',
      description: t('args.save_last_n_steps'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'save_last_n_steps_state',
      type: 'integer',
      description: t('args.save_last_n_steps_state'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'save_state',
      type: 'boolean',
      description: t('args.save_state'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'resume',
      type: 'string',
      description: t('args.resume'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'train_batch_size',
      type: 'integer',
      description: t('args.train_batch_size'),
      default: 1,
      num:{
        min: 1,
        max: 64,
        step: 1
      }
    },
    {
      name: 'max_token_length',
      type: 'integer',
      description: t('args.max_token_length'),
      default: null,
      category: 'training_arguments',
      choices: [null, 150, 225]
    },
    {
      name: 'mem_eff_attn',
      type: 'boolean',
      description: t('args.mem_eff_attn'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'xformers',
      type: 'boolean',
      description: t('args.xformers'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'vae',
      type: 'string',
      description: t('args.vae'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'max_train_steps',
      type: 'integer',
      description: t('args.max_train_steps'),
      default: 1600,
      category: 'training_arguments',
      validate: [
        valueRequired,
        mustNumber
      ]
    },
    {
      name: 'max_train_epochs',
      type: 'integer',
      description: t('args.max_train_epochs'),
      default: null,
      category: 'training_arguments',
      validate: [
        valueRequired,
        mustNumber
      ]
    },
    {
      name: 'max_data_loader_n_workers',
      type: 'integer',
      description: t('args.max_data_loader_n_workers'),
      default: 8,
      category: 'training_arguments',
      validate: [
        valueRequired,
        mustNumber
      ]
    },
    {
      name: 'persistent_data_loader_workers',
      type: 'boolean',
      description: t('args.persistent_data_loader_workers'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'seed',
      type: 'integer',
      description: t('args.seed'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'gradient_checkpointing',
      type: 'boolean',
      description: t('args.gradient_checkpointing'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'gradient_accumulation_steps',
      type: 'integer',
      description: t('args.gradient_accumulation_steps'),
      default: 1,
      category: 'training_arguments',
      num: {
        min: 1,
        max: 120,
        step: 1
      }
    },
    {
      name: 'mixed_precision',
      type: 'string',
      description: t('args.mixed_precision'),
      default: 'no',
      choices: ['no', 'fp16', 'bf16'],
      category: 'training_arguments'
    },
    {
      name: 'full_fp16',
      type: 'boolean',
      description: t('args.full_fp16'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'clip_skip',
      type: 'integer',
      description: t('args.clip_skip'),
      default: 1,
      category: 'training_arguments'
    },
    {
      name: 'logging_dir',
      type: 'string',
      description: t('args.logging_dir'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'log_with',
      type: 'string',
      description: t('args.log_with'),
      default: null,
      category: 'training_arguments',
      choices: ['tensorboard', 'wandb', 'all']
    },
    {
      name: 'log_prefix',
      type: 'string',
      description: t('args.log_prefix'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'log_tracker_name',
      type: 'string',
      description: t('args.log_tracker_name'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'wandb_api_key',
      type: 'string',
      description: t('args.wandb_api_key'),
      default: null,
      category: 'training_arguments'
    },
    {
      name: 'noise_offset',
      type: 'float',
      description: t('args.noise_offset'),
      default: 0,
      category: 'training_arguments',
      num: {
        min: 0,
        max: 1,
        step: 0.01
      },
      recommendation: [
        createRangeRecom(0.05, 0.15)
      ]
    },
    {
      name: 'multires_noise_iterations',
      type: 'integer',
      description: t('args.multires_noise_iterations'),
      default: null,
      category: 'training_arguments',
      num: {
        max: 0,
        min: 64,
        step: 1
      }
    },
    {
      name: 'multires_noise_discount',
      type: 'float',
      description: t('args.multires_noise_discount'),
      default: 0.3,
      category: 'training_arguments',
      num: {
        max: 1,
        min: 0,
        step: 0.01
      }
    },
    {
      name: 'adaptive_noise_scale',
      type: 'float',
      description: t('args.adaptive_noise_scale'),
      default: 0,
      category: 'training_arguments',
      num: {
        min: -1,
        max: 1,
        step: 0.001
      }
    },
    {
      name: 'lowram',
      type: 'boolean',
      description: t('args.lowram'),
      default: false,
      category: 'training_arguments'
    },
    {
      name: 'sample_every_n_steps',
      type: 'integer',
      description: t('args.sample_every_n_steps'),
      default: null,
      category: 'training_arguments',
      validate: [
        mustNumber
      ]
    },
    {
      name: 'caption_extension',
      type: 'string',
      description: t('args.caption_extension'),
      default: '.txt',
      category: 'dataset_arguments'
    },
    {
      name: 'shuffle_caption',
      type: 'boolean',
      description: t('args.shuffle_caption'),
      default: null,
      category: 'dataset_arguments'
    },
    {
      name: 'color_aug',
      type: 'boolean',
      description: t('args.color_aug'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'flip_aug',
      type: 'boolean',
      description: t('args.flip_aug'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'random_crop',
      type: 'boolean',
      description: t('args.random_crop'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'debug_dataset',
      type: 'boolean',
      description: t('args.debug_dataset'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'resolution',
      type: 'string',
      description: t('args.resolution'),
      default: '512,512',
      category: 'dataset_arguments',
      validate: [
        valueRequired,
        resolutionRule
      ]
    },
    {
      name: 'cache_latents',
      type: 'boolean',
      description: t('args.cache_latents'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'vae_batch_size',
      type: 'integer',
      description: t('args.vae_batch_size'),
      default: 1,
      category: 'dataset_arguments',
      num: {
        min: 0,
        max: 32,
        step: 1
      }
    },
    {
      name: 'cache_latents_to_disk',
      type: 'boolean',
      description: t('args.cache_latents_to_disk'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'enable_bucket',
      type: 'boolean',
      description: t('args.enable_bucket'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'bucket_no_upscale',
      type: 'boolean',
      description: t('args.bucket_no_upscale'),
      default: false,
      category: 'dataset_arguments'
    },
    {
      name: 'token_warmup_min',
      type: 'integer',
      description: t('args.token_warmup_min'),
      default: 1,
      category: 'dataset_arguments'
    }
  ];
};

