<!-- Lootbox Reward Card -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Manrope:wght@700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "tertiary": "#38debb",
              "on-error": "#690005",
              "on-tertiary-container": "#00937a",
              "background": "#041329",
              "primary": "#bcc6e5",
              "on-primary": "#263049",
              "error": "#ffb4ab",
              "on-surface-variant": "#c5c6cd",
              "on-primary-fixed-variant": "#3c4660",
              "primary-fixed-dim": "#bcc6e5",
              "on-surface": "#d6e3ff",
              "secondary-container": "#3c4661",
              "on-tertiary-fixed": "#002019",
              "surface-tint": "#bcc6e5",
              "secondary": "#bcc6e6",
              "inverse-surface": "#d6e3ff",
              "surface-container-lowest": "#010e24",
              "on-primary-fixed": "#101b33",
              "inverse-on-surface": "#233148",
              "surface-container-low": "#0d1c32",
              "surface-dim": "#041329",
              "primary-container": "#0e1830",
              "on-secondary-fixed-variant": "#3c4661",
              "on-primary-container": "#77819e",
              "secondary-fixed-dim": "#bcc6e6",
              "on-secondary": "#263049",
              "on-error-container": "#ffdad6",
              "surface": "#041329",
              "on-secondary-container": "#aab4d4",
              "tertiary-container": "#001e17",
              "surface-container-high": "#1c2a41",
              "outline-variant": "#44474d",
              "on-tertiary": "#00382d",
              "secondary-fixed": "#d9e2ff",
              "on-secondary-fixed": "#101b33",
              "tertiary-fixed": "#5ffbd6",
              "primary-fixed": "#d9e2ff",
              "tertiary-fixed-dim": "#38debb",
              "on-background": "#d6e3ff",
              "surface-container-highest": "#27354c",
              "surface-bright": "#2c3951",
              "on-tertiary-fixed-variant": "#005142",
              "surface-container": "#112036",
              "surface-variant": "#27354c",
              "inverse-primary": "#545e79",
              "outline": "#8f9097",
              "error-container": "#93000a"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .rarity-gradient {
            background: linear-gradient(135deg, #a855f7 0%, #eab308 100%);
            padding: 2px;
        }
        .radial-glow {
            background: radial-gradient(circle at center, rgba(188, 198, 229, 0.15) 0%, rgba(4, 19, 41, 0) 70%);
        }
        .card-shimmer {
            background: linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%);
            background-size: 200% 200%;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-surface font-body selection:bg-tertiary selection:text-on-tertiary">
<!-- TopAppBar Shell -->
<header class="bg-[#041329] dark:bg-[#041329] flex justify-between items-center w-full px-6 h-16 fixed top-0 z-50">
<div class="flex items-center gap-4">
<button class="text-[#bcc6e5] dark:text-[#bcc6e5] active:scale-95 duration-150 p-2 rounded-full hover:bg-[#1c2a41] transition-colors">
<span class="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<h1 class="font-['Manrope'] tracking-wider uppercase text-sm font-bold text-[#bcc6e5] dark:text-[#bcc6e5]">Lootbox Rewards</h1>
</div>
<div class="flex items-center gap-2">
<div class="bg-surface-container-low px-3 py-1.5 rounded-full flex items-center gap-2">
<span class="material-symbols-outlined text-tertiary text-lg" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-headline font-bold text-xs text-[#d6e3ff]">M 4,250</span>
</div>
</div>
</header>
<!-- Main Canvas -->
<main class="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 overflow-hidden">
<!-- Background Ambient Glow -->
<div class="absolute inset-0 radial-glow pointer-events-none"></div>
<!-- Lootbox Opening Sequence Container -->
<div class="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">
<!-- Rarity Reveal Header -->
<div class="mb-8 text-center">
<p class="text-tertiary font-headline font-extrabold tracking-widest text-xs uppercase mb-2">New Unlock</p>
<h2 class="text-4xl font-headline font-black text-on-surface tracking-tighter">Adidas Original</h2>
</div>
<!-- Collectible Card -->
<div class="rarity-gradient rounded-3xl w-full aspect-[3/4] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
<div class="bg-surface-container-lowest h-full w-full rounded-[22px] overflow-hidden flex flex-col relative group">
<!-- Card Shimmer Effect -->
<div class="absolute inset-0 card-shimmer"></div>
<!-- Property Header Area -->
<div class="h-1/2 bg-surface-container-high relative flex items-center justify-center p-8">
<div class="absolute top-4 left-4 flex items-center gap-1.5 bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant/20">
<span class="material-symbols-outlined text-[14px] text-tertiary" data-icon="token" style="font-variation-settings: 'FILL' 1;">token</span>
<span class="text-[10px] font-bold font-headline uppercase tracking-tighter">Apparel District</span>
</div>
<!-- Main Logo Placeholder -->
<div class="w-32 h-32 flex items-center justify-center bg-surface-container-lowest rounded-2xl shadow-inner border border-outline-variant/10">
<span class="material-symbols-outlined text-6xl text-on-surface opacity-90" data-icon="checkroom">checkroom</span>
</div>
<!-- Brand Identity Image -->
<div class="absolute inset-0 opacity-20 mix-blend-overlay">
<img alt="" class="w-full h-full object-cover" data-alt="Modern high-end street fashion photography with cinematic blue and purple lighting focused on sleek textures and brand details" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXXvzfnQR470TBKoMvCGXB6Mh4mm9b3tWtxb_hUGB3ZeHjyfApsfrPMBckNAk4j-_yV6OrOwB7ksUjbxTzxn8jwbF1BBfVgiUfS5A4T1byn7YLbQmfTRs3xC_cI2hniy3P6Qea-lDLjLZrmfjxg71-nNnJ7XQuk8jH4mkzUFD9E3gfg0Mr3f2zVrWvrOQ1ZKN9e0My8v56izVNEMYPjebdAt7PMwmKM3YO0Oy2hUdxOEEG_kZJGKcYtVRbkNqo-XTjknbna9lysFS4"/>
</div>
</div>
<!-- Card Details Area -->
<div class="flex-1 p-6 flex flex-col justify-between">
<div>
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline font-bold text-xl text-on-surface">Originals Flagship</h3>
<p class="text-on-surface-variant text-xs font-medium">Luxury Commercial Estate</p>
</div>
<div class="text-right">
<p class="text-[10px] uppercase text-on-surface-variant font-bold tracking-widest mb-1">Base Rent</p>
<p class="font-headline font-black text-lg text-tertiary">M 450</p>
</div>
</div>
<div class="space-y-2">
<div class="flex justify-between items-center text-xs py-1 border-b border-outline-variant/10">
<span class="text-on-surface-variant">Mortgage Value</span>
<span class="text-on-surface font-semibold">M 2,000</span>
</div>
<div class="flex justify-between items-center text-xs py-1 border-b border-outline-variant/10">
<span class="text-on-surface-variant">Upgrade Cost</span>
<span class="text-on-surface font-semibold">M 5,500</span>
</div>
</div>
</div>
<!-- Card Footer Logo -->
<div class="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
<div class="w-6 h-1 bg-on-surface-variant rounded-full"></div>
<span class="font-headline text-[10px] font-black tracking-[0.2em] uppercase">Adidas</span>
<div class="w-6 h-1 bg-on-surface-variant rounded-full"></div>
</div>
</div>
</div>
</div>
<!-- Metadata & Badges -->
<div class="mt-8 flex flex-col items-center gap-4 w-full">
<div class="text-center">
<span class="text-[#a855f7] font-headline font-black text-2xl tracking-tight italic drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Rarity: Epic</span>
</div>
<div class="bg-surface-container-high/50 border border-tertiary/20 px-6 py-3 rounded-2xl backdrop-blur-sm flex items-center gap-3">
<div class="bg-tertiary/10 p-2 rounded-lg">
<span class="material-symbols-outlined text-tertiary" data-icon="trending_up">trending_up</span>
</div>
<div>
<p class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Passive Bonus</p>
<p class="font-headline font-bold text-on-surface">Bonus: +15$ to base rent</p>
</div>
</div>
</div>
</div>
</main>
<!-- Bottom Action Area -->
<div class="fixed bottom-0 left-0 w-full p-6 z-50">
<button class="w-full bg-gradient-to-r from-primary to-primary-container h-16 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
<span class="material-symbols-outlined text-on-primary" data-icon="inventory_2" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
<span class="font-headline font-black text-on-primary tracking-tight text-lg">ADD TO INVENTORY</span>
</button>
</div>
<!-- Background Subtle Textures -->
<div class="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden z-0">
<div class="absolute top-1/4 -left-12 rotate-12 font-headline font-black text-9xl whitespace-nowrap">BOARDWALK LUXURY ESTATE</div>
<div class="absolute bottom-1/4 -right-12 -rotate-12 font-headline font-black text-9xl whitespace-nowrap">COLLECTIBLE REWARDS</div>
</div>
</body></html>

<!-- Brand Inventory -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "error-container": "#93000a",
              "error": "#ffb4ab",
              "tertiary-fixed": "#5ffbd6",
              "outline": "#8f9097",
              "on-surface-variant": "#c5c6cd",
              "on-secondary-fixed": "#101b33",
              "surface-container-low": "#0d1c32",
              "surface": "#041329",
              "on-secondary": "#263049",
              "inverse-primary": "#545e79",
              "secondary-container": "#3c4661",
              "surface-container-lowest": "#010e24",
              "surface-container": "#112036",
              "on-tertiary-fixed": "#002019",
              "on-primary-fixed-variant": "#3c4660",
              "secondary": "#bcc6e6",
              "surface-bright": "#2c3951",
              "on-secondary-container": "#aab4d4",
              "on-primary": "#263049",
              "on-error-container": "#ffdad6",
              "on-tertiary": "#00382d",
              "surface-dim": "#041329",
              "inverse-surface": "#d6e3ff",
              "surface-variant": "#27354c",
              "on-tertiary-fixed-variant": "#005142",
              "inverse-on-surface": "#233148",
              "primary": "#bcc6e5",
              "on-error": "#690005",
              "on-surface": "#d6e3ff",
              "primary-container": "#0e1830",
              "tertiary": "#38debb",
              "surface-container-high": "#1c2a41",
              "tertiary-container": "#001e17",
              "on-background": "#d6e3ff",
              "on-primary-fixed": "#101b33",
              "surface-container-highest": "#27354c",
              "secondary-fixed": "#d9e2ff",
              "outline-variant": "#44474d",
              "surface-tint": "#bcc6e5",
              "background": "#041329",
              "primary-fixed": "#d9e2ff",
              "on-secondary-fixed-variant": "#3c4661",
              "tertiary-fixed-dim": "#38debb",
              "primary-fixed-dim": "#bcc6e5",
              "on-primary-container": "#77819e",
              "secondary-fixed-dim": "#bcc6e6",
              "on-tertiary-container": "#00937a"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      body {
        background-color: #041329;
        color: #d6e3ff;
        font-family: 'Inter', sans-serif;
      }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="min-h-screen pb-24">
<!-- TopAppBar -->
<header class="bg-[#041329] dark:bg-[#041329] font-['Manrope'] tracking-tight font-bold text-slate-100 docked full-width top-0 sticky bg-[#0d1c32] shadow-[0_10px_25px_rgba(1,14,36,0.4)] z-50">
<div class="flex justify-between items-center w-full px-6 py-4 max-w-full mx-auto">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-primary/20">
<img alt="Player Profile Avatar" data-alt="Close-up studio portrait of a sophisticated man in a dark suit with moody cinematic lighting and deep shadows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkgY496kXV2BU0iDPu6APZS0qCrpMSu_8kXV9PQBYYf0M-tASgwCtmkZcH5cJv9MP55P07beXv83XbtC5LpnDKaOJF3hX6HmVjGP2oomafvnNzae7pT165LLVLq7KE7Zvqh8snaBDTHLDGV47LmlvL3QrcR_XMqEiH_mVqFmbSuhMC1zWhyQ4XnPcS7rTjiPZ9cNHPikzl7MoQDVxYlYCmAQW1WKwxoE08InHL2OT2jEt1QdmNtq_saeWLNJjydrobSfrKPxUNwz5e"/>
</div>
<span class="text-2xl font-black tracking-widest uppercase text-[#bcc6e5]">The Boardroom</span>
</div>
<div class="flex flex-col items-end">
<span class="text-[#bcc6e5] dark:text-[#bcc6e5] text-xl font-extrabold">$2,450,000</span>
<span class="text-[10px] uppercase tracking-tighter text-tertiary">Liquid Assets</span>
</div>
</div>
</header>
<main class="px-6 pt-8 max-w-5xl mx-auto">
<!-- Balance & Filter Section -->
<section class="mb-10">
<div class="flex flex-col gap-6">
<div>
<h1 class="font-headline text-3xl font-extrabold text-on-surface mb-1">Portfolio</h1>
<p class="font-body text-sm text-on-surface-variant">Manage your acquired high-street brands</p>
</div>
<!-- Filter Chips -->
<div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
<button class="px-6 py-2 rounded-full font-headline text-xs font-bold transition-all bg-primary text-on-primary shadow-[0_0_15px_rgba(188,198,229,0.3)]">
                        All
                    </button>
<button class="px-6 py-2 rounded-full font-headline text-xs font-bold transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-bright">
                        Common
                    </button>
<button class="px-6 py-2 rounded-full font-headline text-xs font-bold transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-bright">
                        Rare
                    </button>
<button class="px-6 py-2 rounded-full font-headline text-xs font-bold transition-all bg-surface-container-high text-on-surface-variant hover:bg-surface-bright">
                        Epic
                    </button>
</div>
</div>
</section>
<!-- Brand Grid -->
<section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
<!-- Owned: Nike (Epic) -->
<div class="group relative flex flex-col bg-surface-container-low rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg border border-outline-variant/10">
<div class="absolute top-3 right-3 z-10">
<span class="bg-surface-container-highest/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-tertiary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">trending_up</span>
                        +$45
                    </span>
</div>
<div class="aspect-square flex items-center justify-center p-8 bg-surface-container">
<img alt="Nike" class="w-20 h-20 object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" data-alt="The minimalist Nike swoosh logo in pure white against a deep dark navy background with subtle vignette" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxwUMRsTfzr8lMqXaje3SRoz5d52KLVlB5zP3RAnu5RkHqsPg_c0R0m2qk3m52tpArm38kOC-rpJP3Q1TDCBQPQVX9Xf-3t7Hlvuj2_GWvqOprCw9gjYNegHS6GeVqM2NJJ1GZbchgF_iZSGBffllHJc8ZkrphdIYR8tOVdQiLwMEDZWrL1zYtQ2vfQJDFs4U725SrhNE4vJEJqwjiGj1jxzhak5VFRm5E2P7h-Na-eqrqYrZVn53c7uzwMjDaXi_rf5uOUdy6bHeX"/>
</div>
<div class="p-4 bg-surface-container-high">
<h3 class="font-headline font-bold text-sm tracking-tight">Nike Global</h3>
<p class="font-body text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Epic Asset</p>
</div>
<div class="h-1.5 w-full bg-gradient-to-r from-purple-600 to-fuchsia-500"></div>
</div>
<!-- Owned: Adidas (Rare) -->
<div class="group relative flex flex-col bg-surface-container-low rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg border border-outline-variant/10">
<div class="absolute top-3 right-3 z-10">
<span class="bg-surface-container-highest/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-tertiary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">trending_up</span>
                        +$28
                    </span>
</div>
<div class="aspect-square flex items-center justify-center p-8 bg-surface-container">
<img alt="Adidas" class="w-16 h-16 object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" data-alt="Three diagonal stripe Adidas logo in crisp white centered on a dark professional studio backdrop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9N39AyLPR2uUPnRzPshTp7Z2fVksEYMu76Yl8YZOmH8OTvTgX6UN-OcT_sVSERv1xA1StvdoKvXIseHevw1v-a0PFnZeUCrQXyn5cfn-W9ih_HlTjxY2kHekf6fZzrNhLjNNzAwkzj_Wl9F3GRnZfMbTcGuCGatAkGToLIHZUhFVS20eJk7de_W53HWOMEOimKIbaoVtrrSUTOIjHevmZT8u49LdfjxsW8mGKaB7_ia0lupepU6SlbDEyEAt9QqDVFD_aH0yBu1Lv"/>
</div>
<div class="p-4 bg-surface-container-high">
<h3 class="font-headline font-bold text-sm tracking-tight">Adidas Originals</h3>
<p class="font-body text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Rare Asset</p>
</div>
<div class="h-1.5 w-full bg-gradient-to-r from-amber-400 to-yellow-600"></div>
</div>
<!-- Owned: Gucci (Epic) -->
<div class="group relative flex flex-col bg-surface-container-low rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg border border-outline-variant/10">
<div class="absolute top-3 right-3 z-10">
<span class="bg-surface-container-highest/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-tertiary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">trending_up</span>
                        +$82
                    </span>
</div>
<div class="aspect-square flex items-center justify-center p-8 bg-surface-container">
<img alt="Gucci" class="w-24 h-24 object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" data-alt="Interlocking Gucci G logo in minimalist white design on a premium textured dark charcoal surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkqRl0ba7ssx0ZLu-EaoPRGEW8gBiCgR4kJq3_ttbI91TtHaD6b3IATC54aaNL95xyO9iFRJARGhiaMQD55K4XXEeMpyd47V33yGuLtdNGtWHHUstCJSDASvLxvZX5jJkMw5E0pOoKxAIwbBEuDcnEuBuTB5m5xFR49YMZ82GsZbcvSBLN9EM4nMJ_H21T_hZB4Fl1_xvOLydQkCuaku__LChSu-qkA4UKPSmoU67U1auwte509Ho7lRBQVoRJ0L70Pl9UerFQZ9Ir"/>
</div>
<div class="p-4 bg-surface-container-high">
<h3 class="font-headline font-bold text-sm tracking-tight">Gucci House</h3>
<p class="font-body text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Epic Asset</p>
</div>
<div class="h-1.5 w-full bg-gradient-to-r from-purple-600 to-fuchsia-500"></div>
</div>
<!-- Locked: Starbucks (Common) -->
<div class="relative flex flex-col bg-surface-container-low/40 rounded-xl overflow-hidden border border-outline-variant/5 grayscale opacity-60">
<div class="absolute inset-0 flex items-center justify-center z-20">
<div class="bg-surface-container-highest/60 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant/20 shadow-xl">
<span class="material-symbols-outlined text-on-surface-variant text-2xl">lock</span>
</div>
</div>
<div class="aspect-square flex items-center justify-center p-8 bg-surface-container-low">
<img alt="Starbucks" class="w-16 h-16 object-contain brightness-0 invert opacity-20" data-alt="Silhouetted Starbucks mermaid logo in faint ghost-like white against a dark blue background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUoXqFqpF8kS1yk2nlNH3VLpKSEX_GqXU7UI4pJhhnidBlkJNNXUBgq_eu52nmDgQ5wz1wLE57RLAY9etbkJC4l_gqcdSpWt97YMmoPQyiaWEDk2DRYDmbLbVxTRVgYjFsOGX6Q5LQNNAXq9rvhcO9MhqYbul_riFsXa9BuT5JFjD6xbRcUlIdKdLzz0SLgFQSaDg3xOmlsUiH5ZqJ43RGUtSCkZXtMgBb4mzUSiDwhEwNF-GP6sfxDvDVxMDatre56DJiJV2jezm4"/>
</div>
<div class="p-4 bg-surface-container-low">
<h3 class="font-headline font-bold text-sm tracking-tight text-on-surface-variant">Starbucks Corp</h3>
<p class="font-body text-[10px] text-on-surface-variant/40 uppercase tracking-widest mt-1">Locked</p>
</div>
<div class="h-1.5 w-full bg-slate-700"></div>
</div>
<!-- Locked: Apple (Epic) -->
<div class="relative flex flex-col bg-surface-container-low/40 rounded-xl overflow-hidden border border-outline-variant/5 grayscale opacity-60">
<div class="absolute inset-0 flex items-center justify-center z-20">
<div class="bg-surface-container-highest/60 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant/20 shadow-xl">
<span class="material-symbols-outlined text-on-surface-variant text-2xl">lock</span>
</div>
</div>
<div class="aspect-square flex items-center justify-center p-8 bg-surface-container-low">
<img alt="Apple" class="w-16 h-16 object-contain brightness-0 invert opacity-20" data-alt="Silhouetted Apple logo in faint ghost-like white against a dark blue background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvqbA0V6vAdX6pl6kUsdBjrslI22sqYXFlo5RY2DCx895Xy1b7BKkEmZcMniirIEMsfeQU7dUStVNPrsNnL52kpTBgc_DB8grDk2QjJo0NoEAvEVR7JBz9PshB6yz8RYgwLH4XWHvbMw3wgxUG_62nkcxz5k7ZeNVL1Y0ltmYZrmqyhYtOeWA1DOYVmM8F2X4XBXOQr95UkrGw-A2oCPC9-W3bS5Frs9fNX7ph8D4pAMelIkJtVlwUTeMOuDQWWDJLFuoK87nnzHZC"/>
</div>
<div class="p-4 bg-surface-container-low">
<h3 class="font-headline font-bold text-sm tracking-tight text-on-surface-variant">Apple Inc.</h3>
<p class="font-body text-[10px] text-on-surface-variant/40 uppercase tracking-widest mt-1">Locked</p>
</div>
<div class="h-1.5 w-full bg-slate-700"></div>
</div>
<!-- Owned: Zara (Common) -->
<div class="group relative flex flex-col bg-surface-container-low rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg border border-outline-variant/10">
<div class="absolute top-3 right-3 z-10">
<span class="bg-surface-container-highest/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-tertiary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">trending_up</span>
                        +$12
                    </span>
</div>
<div class="aspect-square flex items-center justify-center p-8 bg-surface-container">
<img alt="Zara" class="w-20 h-20 object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" data-alt="Zara fashion brand typography logo in elegant white spacing on a dark minimalist background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ0-Rf9oH2PgM0vsoJOk5YhyWIUYP1T0oCP7nJh133Xc7De-K3SHNSGBu_vHz8p9zHvFg6tnTNcP3wMixuka9SeKd72FhjOkwloXnk1_Bcvm_77TuQsMzcH5s6PFtpWaB2bmQehjrNoHFpSqeCV_PB0kBnfNhIetfVQsxnbMFqamihItT2nIMTpiDzPkNmprYRtFYsq1XgttuDhd8mTAC5fWUp_VodiDM2p8lSuaqN6vkMNIMKHEnLfUSK3svpStrewFUQMq5u8qTt"/>
</div>
<div class="p-4 bg-surface-container-high">
<h3 class="font-headline font-bold text-sm tracking-tight">Zara Retail</h3>
<p class="font-body text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Common Asset</p>
</div>
<div class="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
</div>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 w-full z-50 rounded-t-3xl bg-[#0d1c32]/90 backdrop-blur-xl shadow-[0_-10px_30px_rgba(4,19,41,0.8)]">
<div class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3">
<!-- Board -->
<a class="flex flex-col items-center justify-center text-[#c5c6cd] px-6 py-2 hover:text-slate-100 transition-all Active: scale-90 duration-200" href="#">
<span class="material-symbols-outlined mb-1">grid_view</span>
<span class="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold">Board</span>
</a>
<!-- Inventory (ACTIVE) -->
<a class="flex flex-col items-center justify-center text-[#38debb] bg-[#1c2a41] rounded-2xl px-6 py-2 shadow-[0_0_15px_rgba(56,222,187,0.2)] transition-all Active: scale-90 duration-200" href="#">
<span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1;">article</span>
<span class="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold">Inventory</span>
</a>
<!-- Trade -->
<a class="flex flex-col items-center justify-center text-[#c5c6cd] px-6 py-2 hover:text-slate-100 transition-all Active: scale-90 duration-200" href="#">
<span class="material-symbols-outlined mb-1">swap_horiz</span>
<span class="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold">Trade</span>
</a>
<!-- Empire -->
<a class="flex flex-col items-center justify-center text-[#c5c6cd] px-6 py-2 hover:text-slate-100 transition-all Active: scale-90 duration-200" href="#">
<span class="material-symbols-outlined mb-1">domain</span>
<span class="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold">Empire</span>
</a>
</div>
</nav>
</body></html>

<!-- Brand Inventory -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Brand Inventory - Nocturne Boardroom</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary-fixed-dim": "#bcc6e5",
                        "on-secondary-fixed": "#101b33",
                        "tertiary": "#38debb",
                        "on-primary-fixed-variant": "#3c4660",
                        "inverse-surface": "#d6e3ff",
                        "secondary-fixed": "#d9e2ff",
                        "on-secondary-fixed-variant": "#3c4661",
                        "inverse-on-surface": "#233148",
                        "surface-container-highest": "#27354c",
                        "tertiary-fixed-dim": "#38debb",
                        "surface-variant": "#27354c",
                        "outline": "#8f9097",
                        "error-container": "#93000a",
                        "on-primary": "#263049",
                        "primary-container": "#0e1830",
                        "outline-variant": "#44474d",
                        "background": "#041329",
                        "primary": "#bcc6e5",
                        "on-primary-container": "#77819e",
                        "on-primary-fixed": "#101b33",
                        "surface-dim": "#041329",
                        "on-tertiary-fixed-variant": "#005142",
                        "on-secondary": "#263049",
                        "on-surface-variant": "#c5c6cd",
                        "on-secondary-container": "#aab4d4",
                        "secondary": "#bcc6e6",
                        "surface": "#041329",
                        "surface-container-high": "#1c2a41",
                        "secondary-container": "#3c4661",
                        "primary-fixed": "#d9e2ff",
                        "surface-tint": "#bcc6e5",
                        "tertiary-fixed": "#5ffbd6",
                        "on-error": "#690005",
                        "on-surface": "#d6e3ff",
                        "tertiary-container": "#001e17",
                        "on-tertiary-container": "#00937a",
                        "secondary-fixed-dim": "#bcc6e6",
                        "on-tertiary-fixed": "#002019",
                        "surface-bright": "#2c3951",
                        "on-error-container": "#ffdad6",
                        "surface-container": "#112036",
                        "on-tertiary": "#00382d",
                        "inverse-primary": "#545e79",
                        "surface-container-low": "#0d1c32",
                        "error": "#ffb4ab",
                        "surface-container-lowest": "#010e24",
                        "on-background": "#d6e3ff"
                    },
                    fontFamily: {
                        "headline": ["Manrope"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body {
            background-color: #041329;
            color: #d6e3ff;
            -webkit-font-smoothing: antialiased;
        }
        .minted-gradient {
            background: linear-gradient(135deg, #bcc6e5 0%, #0e1830 100%);
        }
        .rarity-glow-tertiary {
            box-shadow: 0 4px 20px -5px rgba(56, 222, 187, 0.4);
        }
        .glass-panel {
            background: rgba(39, 53, 76, 0.6);
            backdrop-filter: blur(20px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="font-body selection:bg-tertiary/30">
<!-- Top Navigation Shell -->
<header class="flex items-center justify-between px-6 h-20 w-full fixed top-0 z-50 bg-[#041329]">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#bcc6e5]">arrow_back</span>
<h1 class="font-headline tracking-wide uppercase text-sm font-bold text-[#bcc6e5]">Inventory</h1>
</div>
<div class="flex items-center bg-[#0d1c32] px-4 py-2 rounded-xl shadow-inner group transition-all">
<span class="material-symbols-outlined text-tertiary text-sm mr-2" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
<span class="font-headline font-extrabold text-[#d6e3ff] tracking-tight">$2,450</span>
</div>
</header>
<main class="pt-24 pb-32 px-6 max-w-md mx-auto">
<!-- Filter Section -->
<section class="mb-8 overflow-x-auto">
<div class="flex gap-3 pb-2">
<button class="px-5 py-2.5 rounded-full bg-surface-bright text-tertiary border border-tertiary/20 font-label text-sm font-semibold shadow-[0_0_15px_rgba(56,222,187,0.2)]">
                    All
                </button>
<button class="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant font-label text-sm font-medium hover:bg-surface-container-high transition-colors">
                    Common
                </button>
<button class="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant font-label text-sm font-medium hover:bg-surface-container-high transition-colors">
                    Rare
                </button>
<button class="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant font-label text-sm font-medium hover:bg-surface-container-high transition-colors">
                    Epic
                </button>
</div>
</section>
<!-- Brand Cards Grid -->
<div class="grid grid-cols-2 gap-4">
<!-- Card 1: Epic -->
<div class="group relative flex flex-col bg-surface-container-low rounded-2xl overflow-hidden transition-all hover:translate-y-[-4px] active:scale-95 duration-300">
<div class="h-32 flex items-center justify-center p-6 bg-surface-container-high/40">
<img alt="Nike brand logo" class="w-16 h-16 object-contain filter grayscale group-hover:grayscale-0 transition-all" data-alt="minimalist white nike swoosh logo on a clean dark navy background with professional lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0WkVZJZ7GOIiCImvg-pgFYjsxOgJijU3SP9ZXPyAFxYk90l1v-AJOWwe_Zi5A4wlNWXsKOKYA6Tf86NpNsbxVvXCqDPbwvPGbr-XaekMMJ_lE6nx8KpU2r1TkBGBDrg0X2KfzM8ed0jpDrTU727RIc0wqrKo_h8COZ_Bl_oSCl5sROgl-YjwEHT6JAjUeLYTiAEVhi0OFCk86W-etA7lj3STEw3lAPojSVHWo_4QNz3RKAl66HviX2zahXnDy2oMDdTCJ0RbHY2Bj"/>
</div>
<div class="p-4 bg-surface-container-low">
<div class="flex justify-between items-start mb-1">
<h3 class="font-headline font-bold text-on-surface text-sm uppercase tracking-wider">Nike</h3>
<span class="text-[10px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded font-bold">+$45</span>
</div>
<p class="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest opacity-60">Athletics</p>
</div>
<div class="h-1.5 w-full bg-purple-500 shadow-[0_-2px_10px_rgba(168,85,247,0.4)]"></div>
</div>
<!-- Card 2: Rare -->
<div class="group relative flex flex-col bg-surface-container-low rounded-2xl overflow-hidden transition-all hover:translate-y-[-4px] active:scale-95 duration-300">
<div class="h-32 flex items-center justify-center p-6 bg-surface-container-high/40">
<img alt="Adidas brand logo" class="w-16 h-16 object-contain filter grayscale group-hover:grayscale-0 transition-all" data-alt="clean adidas three stripes logo in white on a dark architectural background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv_zhqhQBnlk6yjY33Qvd9V2AZUSOR9EDtuxfEFo56UQO40B97KKaSAtNUPCIcqSCgGcm16Gz0a6Me6yAlbEh-2wgr1-nqc9kEevWsSG7MkapGeOX8nfgF-6GZNDW0ilrFebgbjHSGlKhPs7v8Dijq_aAIoTWWMUpgVTlwmoN0c83r79GD_i7MRzNG7TExARdj8ZBi_4jU7SjkQKnCWXnQ6xfqWcnF3g7w56Y3c8WTaC4Cb6eLgQ0WAACxi3PBXhqJHiOhaTtvqvnE"/>
</div>
<div class="p-4 bg-surface-container-low">
<div class="flex justify-between items-start mb-1">
<h3 class="font-headline font-bold text-on-surface text-sm uppercase tracking-wider">Adidas</h3>
<span class="text-[10px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded font-bold">+$25</span>
</div>
<p class="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest opacity-60">Streetwear</p>
</div>
<div class="h-1.5 w-full bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.4)]"></div>
</div>
<!-- Card 3: Legendary -->
<div class="group relative flex flex-col bg-surface-container-low rounded-2xl overflow-hidden transition-all hover:translate-y-[-4px] active:scale-95 duration-300">
<div class="h-32 flex items-center justify-center p-6 bg-surface-container-high/40">
<img alt="Gucci brand logo" class="w-16 h-16 object-contain filter grayscale group-hover:grayscale-0 transition-all" data-alt="luxury gucci interlocking double g logo in gold metallic finish on a deep navy textured surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIumw9SvjyD4n3EHxdFPDPdOmsBtT_-mF-3l45jxBbCH36cS0rRL8d-j6DWCPR0c_1b8GtdX-4TC0488IQzBYCCWVEjF-6J-IsvH7qBtpMbEgRRbuhpdWdjEuC990pqingoeUjV0QNpw2jEqyXdJdECg8dOifNCm_mjVi9Lr-NXDGwtJE4aRpff8k3XPJB-ow_p8AZCPMCd0j8fFDu_aa9Tk3eaGL0Es85fEfaRB6OyMJvoc09wxVd0v_K-257c-gGoAaIJEvgS2Nx"/>
</div>
<div class="p-4 bg-surface-container-low">
<div class="flex justify-between items-start mb-1">
<h3 class="font-headline font-bold text-on-surface text-sm uppercase tracking-wider">Gucci</h3>
<span class="text-[10px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded font-bold">+$120</span>
</div>
<p class="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest opacity-60">High Luxury</p>
</div>
<div class="h-1.5 w-full bg-amber-400 shadow-[0_-2px_15px_rgba(251,191,36,0.6)]"></div>
</div>
<!-- Card 4: Common -->
<div class="group relative flex flex-col bg-surface-container-low rounded-2xl overflow-hidden transition-all hover:translate-y-[-4px] active:scale-95 duration-300">
<div class="h-32 flex items-center justify-center p-6 bg-surface-container-high/40">
<img alt="Zara brand logo" class="w-16 h-16 object-contain filter grayscale group-hover:grayscale-0 transition-all" data-alt="zara typography logo in sleek white lettering against a dark boardroom aesthetic backdrop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA86fCOPYz1cL5LicPgmoCsj0L3BR6fxoBYF1Wf59S_GLmsnPu9iSycG2dFjtBYdYlWp8YVb4QdMaeoaz-7Dqck2Y8jvB7KSLWLFkIofSp5_znp8sC15o1l03JuN8FH9jXHatuxmq1phU7oZnxHGfRUj3UXUW_gWLJFwneVBEdWSLTHOVBd4bSw77O8pc6FdoFqIS53-ZbkE0gOacsore8pCj2uv8ider3jZyViz6yVIMsH7RXLzp5lXaJOrIrFd196vovJwdz1IVFR"/>
</div>
<div class="p-4 bg-surface-container-low">
<div class="flex justify-between items-start mb-1">
<h3 class="font-headline font-bold text-on-surface text-sm uppercase tracking-wider">Zara</h3>
<span class="text-[10px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded font-bold">+$12</span>
</div>
<p class="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest opacity-60">Fast Fashion</p>
</div>
<div class="h-1.5 w-full bg-slate-500"></div>
</div>
<!-- Locked Card 1 -->
<div class="flex flex-col bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-2xl overflow-hidden opacity-40">
<div class="h-32 flex items-center justify-center p-6 bg-surface-container-high/10">
<span class="material-symbols-outlined text-4xl text-outline-variant">lock</span>
</div>
<div class="p-4">
<div class="h-4 w-20 bg-outline-variant/20 rounded mb-2"></div>
<div class="h-2 w-12 bg-outline-variant/10 rounded"></div>
</div>
</div>
<!-- Locked Card 2 -->
<div class="flex flex-col bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-2xl overflow-hidden opacity-40">
<div class="h-32 flex items-center justify-center p-6 bg-surface-container-high/10">
<span class="material-symbols-outlined text-4xl text-outline-variant">lock</span>
</div>
<div class="p-4">
<div class="h-4 w-24 bg-outline-variant/20 rounded mb-2"></div>
<div class="h-2 w-10 bg-outline-variant/10 rounded"></div>
</div>
</div>
</div>
<!-- Floating Action Button: Contextual for Inventory -->
<button class="fixed bottom-28 right-6 w-14 h-14 rounded-2xl minted-gradient flex items-center justify-center shadow-2xl active:scale-90 transition-transform z-40 group">
<span class="material-symbols-outlined text-on-primary text-3xl group-hover:rotate-12 transition-transform">add_business</span>
</button>
</main>
<!-- Bottom Navigation Shell -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#0d1c32]/90 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-10px_25px_rgba(1,14,36,0.4)]">
<div class="flex flex-col items-center justify-center text-[#c5c6cd] opacity-60 hover:opacity-100 transition-opacity">
<span class="material-symbols-outlined mb-1">grid_view</span>
<span class="font-['Inter'] text-[10px] font-medium tracking-tight">Board</span>
</div>
<div class="flex flex-col items-center justify-center bg-[#2c3951] text-[#38debb] rounded-2xl px-5 py-2 animate-pulse-slow">
<span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
<span class="font-['Inter'] text-[10px] font-medium tracking-tight">Inventory</span>
</div>
<div class="flex flex-col items-center justify-center text-[#c5c6cd] opacity-60 hover:opacity-100 transition-opacity">
<span class="material-symbols-outlined mb-1">storefront</span>
<span class="font-['Inter'] text-[10px] font-medium tracking-tight">Market</span>
</div>
<div class="flex flex-col items-center justify-center text-[#c5c6cd] opacity-60 hover:opacity-100 transition-opacity">
<span class="material-symbols-outlined mb-1">person</span>
<span class="font-['Inter'] text-[10px] font-medium tracking-tight">Profile</span>
</div>
</nav>
</body></html>

<!-- Match Results & Rewards -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Match Results - Midnight Architect</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface-container-high": "#1c2a41",
              "primary-container": "#0e1830",
              "on-primary-fixed": "#101b33",
              "tertiary-fixed": "#5ffbd6",
              "inverse-surface": "#d6e3ff",
              "on-surface-variant": "#c5c6cd",
              "primary-fixed": "#d9e2ff",
              "on-surface": "#d6e3ff",
              "surface-variant": "#27354c",
              "on-primary-fixed-variant": "#3c4660",
              "inverse-on-surface": "#233148",
              "on-secondary-container": "#aab4d4",
              "surface-dim": "#041329",
              "surface-bright": "#2c3951",
              "on-secondary": "#263049",
              "surface-container": "#112036",
              "inverse-primary": "#545e79",
              "secondary-fixed-dim": "#bcc6e6",
              "secondary-fixed": "#d9e2ff",
              "secondary-container": "#3c4661",
              "tertiary-fixed-dim": "#38debb",
              "on-error": "#690005",
              "on-tertiary-fixed": "#002019",
              "on-background": "#d6e3ff",
              "background": "#041329",
              "outline-variant": "#44474d",
              "on-secondary-fixed": "#101b33",
              "on-error-container": "#ffdad6",
              "secondary": "#bcc6e6",
              "primary": "#bcc6e5",
              "surface-tint": "#bcc6e5",
              "on-tertiary-container": "#00937a",
              "tertiary-container": "#001e17",
              "surface": "#041329",
              "tertiary": "#38debb",
              "surface-container-low": "#0d1c32",
              "on-tertiary-fixed-variant": "#005142",
              "surface-container-lowest": "#010e24",
              "on-secondary-fixed-variant": "#3c4661",
              "on-primary-container": "#77819e",
              "on-primary": "#263049",
              "on-tertiary": "#00382d",
              "surface-container-highest": "#27354c",
              "error-container": "#93000a",
              "primary-fixed-dim": "#bcc6e5",
              "outline": "#8f9097",
              "error": "#ffb4ab"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      .bronze-gradient {
        background: linear-gradient(135deg, #cd7f32 0%, #8b4513 100%);
      }
      .glass-modal {
        backdrop-filter: blur(20px);
        background: rgba(39, 53, 76, 0.6);
      }
      .minted-button {
        background: linear-gradient(135deg, #bcc6e5 0%, #0e1830 100%);
      }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface font-body text-on-surface antialiased overflow-hidden">
<!-- TopAppBar -->
<header class="fixed top-0 w-full z-50 bg-[#041329] flex items-center justify-between px-6 h-16 w-full">
<div class="flex items-center gap-4">
<button class="text-[#bcc6e5] active:scale-95 duration-200 p-2 hover:bg-[#1c2a41] rounded-full transition-colors">
<span class="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<h1 class="font-headline tracking-wider uppercase font-bold text-sm text-[#bcc6e5]">MATCH RESULTS</h1>
</div>
<button class="text-[#bcc6e5] active:scale-95 duration-200 p-2 hover:bg-[#1c2a41] rounded-full transition-colors">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
</button>
</header>
<!-- Main Content Canvas (Blurred Background List) -->
<main class="pt-20 px-6 pb-24 min-h-screen blur-md select-none pointer-events-none">
<div class="space-y-4">
<!-- Ranking List -->
<div class="flex flex-col gap-3">
<!-- Rank 1 -->
<div class="bg-surface-container-high p-5 rounded-xl flex items-center justify-between shadow-[10px_0_25px_rgba(1,14,36,0.4)] border-r-4 border-tertiary">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full overflow-hidden bg-surface-bright flex items-center justify-center border border-tertiary/30">
<img alt="Architect Alpha" data-alt="minimalist profile avatar of a luxury architect character on a dark blue background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyuLS5fISrwVKWqsPEJ4GipEXUZDypSPT346ZsGP61jomM_2FpisG300ActHlgU6jsIFC7mBCwHlJZT8DJOzqzAJyp8xBqdj_qHioA6IWcxczBBj1oT8SoLNrVq2sDIo1b0eDluDBu9br8cLYorIvHLuraEXHoh5uiq6Vl9NSJ0HM-oS2IcBu-HGe3Ydu0CvZ9dLgQgcw0fjXwCgn-CGhfCZtRF5tAFk6PzUVbkw_w7tpme-9Z_DFLpRUYaT2NXNYGnNYK37uWYi0R"/>
</div>
<div>
<p class="font-headline font-bold text-on-surface">Architect Alpha</p>
<p class="text-xs text-on-surface-variant font-medium">Rank #1</p>
</div>
</div>
<div class="text-right">
<p class="font-headline font-extrabold text-tertiary text-lg">$1.2M</p>
</div>
</div>
<!-- Rank 2 -->
<div class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center">
<img alt="Neon Nomad" data-alt="sleek modern profile avatar of a cyberpunk traveler on a dark charcoal background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsgZmZidZEMdrBEiPAhxnD0EBEcoL-bDFCUjvOudRV0vj-byRz5phfcajyges-WZhnpa9Loqjy1F4KRxZgcLg7xbH7ng67xTCUv2gqQc59BtYCjkxYSTK7a0p3194x23I-zE6JCABYM2IqCsfE-O1AeqSyneORk9pruKrg2GjxHjnC2j8U_qlIocLoypsSUnSkypvBbHbRyluzcHKsud9cSjySaJIZl-iSWvGQc1GimFm88BAG7HJToY9vlp4CRF6yanCvYFhsBo4Q"/>
</div>
<div>
<p class="font-headline font-bold text-on-surface opacity-80">Neon Nomad</p>
<p class="text-xs text-on-surface-variant">Rank #2</p>
</div>
</div>
<div class="text-right">
<p class="font-headline font-bold text-on-surface-variant">$980K</p>
</div>
</div>
<!-- Rank 3 -->
<div class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between opacity-60">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center">
<img alt="Slate Shogun" data-alt="minimalist warrior icon in profile with cool slate gray tones and sharp lines" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMy0LF5RzuHm_W95PWiwmOzbBcqD78lwZWgyyGXJuR-DgAuncWrKC8P_t_6G2UzlPC5s2h5Ys1Ea1kxsXeCdLGiprifAw6aa0tcmYxnaM-89yS-oU0wNuWW3b32a-BEi5gS3XnSDVh3B_Pcfki5oiLFMm1frttlqwXLIBHPvTYcj-3rqI92utG-mXWU9dlWfUvlFER9gVhjJmthUdYNhLanEda3C5l6MyqfQeoEThwaxnUa9AqMHCIDjhISNRAC5Otj4moJFHbljFN"/>
</div>
<div>
<p class="font-headline font-bold text-on-surface">Slate Shogun</p>
<p class="text-xs text-on-surface-variant">Rank #3</p>
</div>
</div>
<div class="text-right">
<p class="font-headline font-bold text-on-surface-variant">$745K</p>
</div>
</div>
<!-- Rank 4 -->
<div class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between opacity-40">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center">
<img alt="Midnight Mayor" data-alt="abstract icon of a formal hat and monocle in dark blues and grays" src="https://lh3.googleusercontent.com/aida-public/AB6AXuARI9KkK0HlOezdAjQV8ASe43HzCeiXVJbpLCtbDUwFOfp4Sm6Qv5qjOkwrBgSZJskg05IPt1rDfRFSGQdgpd-jYPehmekNEas13lh-NLHWS1H-5ZOvTQhd3qljIbrK_FAkMNLkCmows6J8yw2mcXw_d8OijWqKBRKa3YPj8j-NqoA5zr9L-XfHSr9S3KsXi4KZ4gtbmKaWhMoLFCeU-XRti8hgfGktQdgwnfpvZrDIgUdnvOmH6-ahUL0WykP6OZ2FB6B1gCfSRDp9"/>
</div>
<div>
<p class="font-headline font-bold text-on-surface">Midnight Mayor</p>
<p class="text-xs text-on-surface-variant">Rank #4</p>
</div>
</div>
<div class="text-right">
<p class="font-headline font-bold text-on-surface-variant">$420K</p>
</div>
</div>
</div>
</div>
</main>
<!-- Overlay Modal -->
<div class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-surface/40">
<div class="glass-modal w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center text-center border border-outline-variant/20 shadow-[0_20px_50px_rgba(1,14,36,0.8)]">
<div class="mb-2">
<h2 class="font-headline font-black text-2xl tracking-tight text-on-surface uppercase">MATCH FINISHED!</h2>
<p class="text-on-surface-variant text-sm font-medium mt-1">You've earned a Bronze Brand Case</p>
</div>
<!-- 3D Asset Container -->
<div class="relative w-full aspect-square flex items-center justify-center my-4 group">
<!-- Ambient Glow behind the case -->
<div class="absolute w-48 h-48 rounded-full bg-secondary/10 blur-[60px]"></div>
<!-- Stylized Case Illustration -->
<div class="relative w-48 h-48">
<div class="absolute inset-0 bronze-gradient rounded-3xl rotate-12 scale-90 shadow-2xl opacity-50"></div>
<div class="absolute inset-0 bronze-gradient rounded-3xl border border-white/10 flex flex-col items-center justify-center overflow-hidden">
<!-- Case Details -->
<div class="w-full h-1/2 bg-white/5 flex items-end justify-center pb-2">
<div class="w-16 h-2 bg-on-surface/20 rounded-full"></div>
</div>
<div class="w-full h-1/2 flex items-start justify-center pt-4">
<div class="w-12 h-12 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center shadow-inner">
<span class="material-symbols-outlined text-secondary text-3xl" style="font-variation-settings: 'FILL' 1;">lock</span>
</div>
</div>
<!-- Decorative Ribs -->
<div class="absolute left-4 top-0 bottom-0 w-1 bg-black/20"></div>
<div class="absolute right-4 top-0 bottom-0 w-1 bg-black/20"></div>
</div>
</div>
</div>
<!-- Action Button -->
<button class="minted-button w-full py-5 rounded-2xl font-headline font-extrabold text-on-primary text-lg tracking-widest shadow-[0_10px_30px_rgba(188,198,229,0.3)] hover:scale-105 active:scale-95 transition-all duration-300">
                OPEN NOW
            </button>
<button class="mt-6 text-on-surface-variant/60 font-label text-xs uppercase tracking-widest hover:text-on-surface transition-colors">
                CLAIM LATER
            </button>
</div>
</div>
<!-- BottomNavBar (Suppressed for focused modal, but defined as per JSON) -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-6 pt-4 bg-[#0d1c32]/80 backdrop-blur-xl rounded-t-3xl border-t border-[#44474d]/20 shadow-[0_-10px_25px_rgba(1,14,36,0.4)]">
<button class="text-[#c5c6cd] p-3 hover:text-[#d6e3ff] transition-transform active:scale-90">
<span class="material-symbols-outlined" data-icon="home">home</span>
</button>
<button class="text-[#c5c6cd] p-3 hover:text-[#d6e3ff] transition-transform active:scale-90">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
</button>
<button class="bg-[#2c3951] text-[#38debb] rounded-xl p-3 shadow-[0_0_15px_rgba(56,222,187,0.2)] transition-transform active:scale-90">
<span class="material-symbols-outlined" data-icon="emoji_events">emoji_events</span>
</button>
<button class="text-[#c5c6cd] p-3 hover:text-[#d6e3ff] transition-transform active:scale-90">
<span class="material-symbols-outlined" data-icon="storefront">storefront</span>
</button>
<button class="text-[#c5c6cd] p-3 hover:text-[#d6e3ff] transition-transform active:scale-90">
<span class="material-symbols-outlined" data-icon="person">person</span>
</button>
</nav>
</body></html>

<!-- Game Lobby -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Nocturne Boardroom - Lobby</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface-container-lowest": "#010e24",
              "inverse-surface": "#d6e3ff",
              "secondary-fixed-dim": "#bcc6e6",
              "primary-fixed": "#d9e2ff",
              "secondary-fixed": "#d9e2ff",
              "secondary": "#bcc6e6",
              "on-tertiary-fixed-variant": "#005142",
              "surface-dim": "#041329",
              "tertiary-fixed-dim": "#38debb",
              "surface-container-low": "#0d1c32",
              "surface-container-highest": "#27354c",
              "outline": "#8f9097",
              "on-error-container": "#ffdad6",
              "surface-tint": "#bcc6e5",
              "error-container": "#93000a",
              "tertiary": "#38debb",
              "on-tertiary-container": "#00937a",
              "error": "#ffb4ab",
              "on-primary-container": "#77819e",
              "surface-container-high": "#1c2a41",
              "on-surface-variant": "#c5c6cd",
              "on-tertiary": "#00382d",
              "on-secondary-container": "#aab4d4",
              "tertiary-fixed": "#5ffbd6",
              "on-primary-fixed": "#101b33",
              "inverse-on-surface": "#233148",
              "on-secondary-fixed": "#101b33",
              "surface-container": "#112036",
              "surface-bright": "#2c3951",
              "on-tertiary-fixed": "#002019",
              "surface-variant": "#27354c",
              "inverse-primary": "#545e79",
              "on-error": "#690005",
              "outline-variant": "#44474d",
              "on-primary": "#263049",
              "on-surface": "#d6e3ff",
              "tertiary-container": "#001e17",
              "surface": "#041329",
              "secondary-container": "#3c4661",
              "background": "#041329",
              "on-secondary-fixed-variant": "#3c4661",
              "on-secondary": "#263049",
              "primary": "#bcc6e5",
              "primary-container": "#0e1830",
              "on-background": "#d6e3ff",
              "primary-fixed-dim": "#bcc6e5",
              "on-primary-fixed-variant": "#3c4660"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      .neon-glow-tertiary {
        box-shadow: 0 0 15px rgba(56, 222, 187, 0.4);
      }
      .neon-glow-error {
        box-shadow: 0 0 15px rgba(255, 180, 171, 0.4);
      }
      ::-webkit-scrollbar {
        display: none;
      }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface text-on-surface font-body select-none">
<!-- TopAppBar -->
<header class="w-full top-0 z-50 sticky bg-[#041329] dark:bg-[#041329] flex items-center justify-between px-6 py-4 w-full">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-[#bcc6e5] cursor-pointer" data-icon="grid_view">grid_view</span>
<h1 class="font-['Manrope'] tracking-wider uppercase font-bold text-sm text-[#d6e3ff] text-xl font-black tracking-tighter">NOCTURNE BOARDROOM</h1>
</div>
<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
<img alt="Player Avatar" class="w-full h-full object-cover" data-alt="Close-up portrait of a digital stylized avatar with blue neon rim lighting and a sleek futuristic aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLH06v2EX8K3FEfHA3ZmDDVrxXRegWpTiLuGTI5Fu9-1lDk1TGLxvXqRM1QB3TgrDogehKokC1-S590kcTYlF93bgm63I2tKeF2SrrP8OFGceFCC0P9zJ85Y0TVpwKf-a76YFj9bTKIgHz6RZaFBC_80eb8kc60YaVYpsO_QC8TuFNmtqSxOhLuPBtBuVtxxW4bHh1s6CFtbOM96IWCQtCprnSKj7GQgPNK_tpWiwWD6oPPh4CDXiBLWenoohPVUwcd-k6ab3XiJ5y"/>
</div>
</header>
<main class="pb-32 px-6 pt-4 space-y-8">
<!-- Player Slots Section -->
<section class="space-y-4">
<div class="flex items-center justify-between mb-2">
<h2 class="font-headline text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">Current Lobby</h2>
<span class="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">4/4 PLAYERS</span>
</div>
<div class="grid grid-cols-1 gap-3">
<!-- Slot 1: Architect Alpha -->
<div class="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border-l-4 border-tertiary shadow-lg transition-all duration-300">
<div class="flex items-center gap-4">
<div class="relative">
<img alt="Architect Alpha" class="w-12 h-12 rounded-lg object-cover" data-alt="Professional profile of a man with sophisticated lighting and deep blue shadow tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQeSlhZMVi2iStbfgZ_k_qPBxbSN2kbnTIn-3Q9dfgOWo6Z2ppm-nIoxS6G_4OxsKMqx3rbQsnqHa-yQnW7Dk6dHs3bjXH-B51iMp0MZrHgrBDX45Lu1LfXcIBcSOs20hRXBit0MPUsRBjpByFf1enD9-4BfgGMT7rEE4BvhEM-faKX__a-LrCJ4KW7J7zmEVhkK_fHpQCCcxsgdltw38KGmbp0UGCZq5-OI7nqDj9wCdZi0vtKHu-K0R0DtTOGhSyx8JwoWRQdeaD"/>
<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-tertiary rounded-full border-2 border-surface-container-low"></div>
</div>
<div>
<p class="font-headline font-bold text-sm text-on-surface">Architect Alpha</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Host • Level 42</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="text-[10px] font-black text-tertiary neon-glow-tertiary px-3 py-1 bg-tertiary/10 rounded-full">READY</span>
</div>
</div>
<!-- Slot 2: Neon Nomad -->
<div class="bg-surface-container-low p-4 rounded-xl flex items-center justify-between transition-all duration-300">
<div class="flex items-center gap-4">
<div class="relative">
<img alt="Neon Nomad" class="w-12 h-12 rounded-lg object-cover opacity-80" data-alt="Artistic portrait of a woman with vibrant magenta and cyan light streaks across her face" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUpoCqssHJQBHEglrxwKXoMBPWaTdNT6ifuvXl4hiezaQXCHnOEpgPbR6SuZUrUVtnTu93PQfgdzRsIzdvDFnrbmGtuF3dJeuC7nnKoeqofXlug_nHuC05t6DyWY6NmcZB9rbE6ahDluKUTdJOu7SBnBVTpRXRwQcZDOJDK2iytnJNa6Q0DK2JyED7Gtxsp6TmzqX_-EyuMySLg0bCD804Etb6pDjUGMAY7vKNMawbRKGgOzOjZrXCHU86TChmFXrgsFNoCyhjmXSj"/>
</div>
<div>
<p class="font-headline font-bold text-sm text-on-surface">Neon Nomad</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Member • Level 28</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="text-[10px] font-black text-error neon-glow-error px-3 py-1 bg-error/10 rounded-full">NOT READY</span>
</div>
</div>
<!-- Slot 3: Glitch Geist -->
<div class="bg-surface-container-low p-4 rounded-xl flex items-center justify-between transition-all duration-300">
<div class="flex items-center gap-4">
<div class="relative">
<img alt="Glitch Geist" class="w-12 h-12 rounded-lg object-cover" data-alt="Close-up of a person with digital glitch effects and neon green overlay" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKBFtpyjLvqAkmEJRfjzxA4fRZNgt_hfkszHsTx8_HnBmhPVWJSJgi3H4JBHO3fdDDB_2iNrUdrGFa8aw2ddB_lf-mM0vCTLoJyf0qcWMeJ4rAo8DrNH4jS7KBZjarDOx_s63QdJBHW-0uutyCuJN47tvQLER6-9xta1orGr4ZhcWqIzpEaMvWMjRNXQZhlo4u21Kxk9yfUgBF7YBJKuzjR5mXSeZSW4MESWXbQ3g_I0HjZZFSppjO_mGiV-qvzvweLvZCBbj8doE8"/>
</div>
<div>
<p class="font-headline font-bold text-sm text-on-surface">Glitch Geist</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Member • Level 35</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="text-[10px] font-black text-tertiary neon-glow-tertiary px-3 py-1 bg-tertiary/10 rounded-full">READY</span>
</div>
</div>
<!-- Slot 4: Cyber Sultan -->
<div class="bg-surface-container-low p-4 rounded-xl flex items-center justify-between transition-all duration-300">
<div class="flex items-center gap-4">
<div class="relative">
<img alt="Cyber Sultan" class="w-12 h-12 rounded-lg object-cover opacity-80" data-alt="Abstract portrait of a person wearing sleek mirrored sunglasses reflecting a dark cityscape" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAB1oLxZ8N7MNtU27N8vFJBAQ7INysCgWIzaKUm-n9uKdIOrGkYGwZOOSHckq_N9bks_MrVNxySS60HBdAzzqPs5cm-aMM41MOKjlCamH2v6uavD09BK5vJuZUyyg8onaNHUVmIH6Y-DX_eLlwkp2_OB2frDt7_1j3qIR7MvlHwzr8r999CsOvD2aALTiiLR5Pr9GRzdI91oCDIkEgZQz9fQqAihUZHQNsnT_UfoV08ltovP6h3-srR-9e5uIfCv0HI9z1ovbansRxH"/>
</div>
<div>
<p class="font-headline font-bold text-sm text-on-surface">Cyber Sultan</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Member • Level 19</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="text-[10px] font-black text-error neon-glow-error px-3 py-1 bg-error/10 rounded-full">NOT READY</span>
</div>
</div>
</div>
</section>
<!-- Middle Section: My Match Skins -->
<section class="space-y-4">
<div class="flex items-center justify-between">
<h2 class="font-headline text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">My Match Skins</h2>
<button class="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                    Inventory <span class="material-symbols-outlined text-xs" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
<div class="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2 snap-x">
<!-- Sportswear Category -->
<div class="snap-start min-w-[160px] flex-shrink-0 group">
<div class="text-[9px] font-black text-on-surface-variant/60 uppercase mb-2 tracking-widest">Sportswear</div>
<div class="relative bg-surface-container-high rounded-xl aspect-[3/4] p-3 border border-tertiary/30 overflow-hidden flex flex-col justify-between">
<div class="absolute top-0 right-0 p-2">
<span class="material-symbols-outlined text-tertiary text-lg" data-icon="verified" style="font-variation-settings: 'FILL' 1;">verified</span>
</div>
<div class="mt-4 flex justify-center">
<div class="w-16 h-16 bg-gradient-to-br from-tertiary/20 to-transparent rounded-full flex items-center justify-center border border-tertiary/20">
<span class="material-symbols-outlined text-3xl text-tertiary" data-icon="footprint">footprint</span>
</div>
</div>
<div class="space-y-1">
<p class="font-headline font-extrabold text-[11px] text-on-surface leading-tight">ADIDAS EPIC</p>
<div class="flex justify-between items-center">
<span class="text-[8px] text-on-surface-variant font-bold uppercase">Asset V.2</span>
<span class="text-[9px] text-tertiary font-black">+15% Rent</span>
</div>
</div>
</div>
</div>
<!-- Luxury Watches Category -->
<div class="snap-start min-w-[160px] flex-shrink-0">
<div class="text-[9px] font-black text-on-surface-variant/60 uppercase mb-2 tracking-widest">Luxury Watches</div>
<div class="relative bg-surface-container-low rounded-xl aspect-[3/4] p-3 border border-outline-variant/20 overflow-hidden flex flex-col items-center justify-center group hover:bg-surface-container-high transition-colors">
<div class="w-12 h-12 rounded-full border-2 border-dashed border-outline-variant/40 flex items-center justify-center text-outline-variant group-hover:text-primary transition-colors">
<span class="material-symbols-outlined text-2xl" data-icon="add">add</span>
</div>
<p class="mt-3 text-[10px] font-bold text-outline-variant uppercase tracking-tighter group-hover:text-on-surface">Assign Item</p>
</div>
</div>
<!-- Tech Gadgets Category -->
<div class="snap-start min-w-[160px] flex-shrink-0">
<div class="text-[9px] font-black text-on-surface-variant/60 uppercase mb-2 tracking-widest">Tech Gadgets</div>
<div class="relative bg-surface-container-high rounded-xl aspect-[3/4] p-3 border border-primary/30 overflow-hidden flex flex-col justify-between">
<div class="absolute top-0 right-0 p-2">
<span class="material-symbols-outlined text-primary text-lg" data-icon="bolt" style="font-variation-settings: 'FILL' 1;">bolt</span>
</div>
<div class="mt-4 flex justify-center">
<div class="w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-full flex items-center justify-center border border-primary/20">
<span class="material-symbols-outlined text-3xl text-primary" data-icon="smartphone">smartphone</span>
</div>
</div>
<div class="space-y-1">
<p class="font-headline font-extrabold text-[11px] text-on-surface leading-tight">NEURAL LINK</p>
<div class="flex justify-between items-center">
<span class="text-[8px] text-on-surface-variant font-bold uppercase">Rare Asset</span>
<span class="text-[9px] text-primary font-black">+20% Speed</span>
</div>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Bottom Actions & Navigation Shell -->
<div class="fixed bottom-0 w-full z-50">
<!-- Ready Button -->
<div class="px-6 pb-24">
<button class="w-full py-5 rounded-2xl bg-gradient-to-r from-tertiary to-on-tertiary-container text-on-tertiary font-black font-headline text-lg tracking-[0.15em] uppercase shadow-[0_10px_30px_rgba(56,222,187,0.3)] active:scale-95 transition-transform">
                READY
            </button>
</div>
<!-- BottomNavBar -->
<nav class="bg-[#0d1c32]/80 backdrop-blur-md border-t border-[#44474d]/20 fixed bottom-0 w-full flex justify-around items-center px-4 pb-6 pt-3 rounded-t-2xl shadow-[0_-10px_25px_rgba(1,14,36,0.4)]">
<a class="flex flex-col items-center justify-center text-[#38debb] bg-[#1c2a41] rounded-xl px-4 py-1 active:scale-90 transition-transform" href="#">
<span class="material-symbols-outlined" data-icon="meeting_room">meeting_room</span>
<span class="font-['Inter'] text-[10px] font-bold uppercase tracking-widest mt-1">Lobby</span>
</a>
<a class="flex flex-col items-center justify-center text-[#c5c6cd] hover:text-[#d6e3ff] active:scale-90 transition-transform" href="#">
<span class="material-symbols-outlined" data-icon="app_registration">app_registration</span>
<span class="font-['Inter'] text-[10px] font-bold uppercase tracking-widest mt-1">Skins</span>
</a>
<a class="flex flex-col items-center justify-center text-[#c5c6cd] hover:text-[#d6e3ff] active:scale-90 transition-transform" href="#">
<span class="material-symbols-outlined" data-icon="group">group</span>
<span class="font-['Inter'] text-[10px] font-bold uppercase tracking-widest mt-1">Social</span>
</a>
<a class="flex flex-col items-center justify-center text-[#c5c6cd] hover:text-[#d6e3ff] active:scale-90 transition-transform" href="#">
<span class="material-symbols-outlined" data-icon="check_circle">check_circle</span>
<span class="font-['Inter'] text-[10px] font-bold uppercase tracking-widest mt-1">Ready</span>
</a>
</nav>
</div>
</body></html>

<!-- Design System -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Monopoly: Nocturne Boardroom</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&amp;family=Inter:wght@400;500;600&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "on-primary": "#263049",
                "surface-variant": "#27354c",
                "on-surface-variant": "#c5c6cd",
                "background": "#041329",
                "tertiary-container": "#001e17",
                "surface-bright": "#2c3951",
                "surface-container-highest": "#27354c",
                "on-tertiary": "#00382d",
                "primary-fixed-dim": "#bcc6e5",
                "on-primary-fixed": "#101b33",
                "secondary-container": "#3c4661",
                "secondary-fixed-dim": "#bcc6e6",
                "secondary-fixed": "#d9e2ff",
                "inverse-surface": "#d6e3ff",
                "on-tertiary-container": "#00937a",
                "outline-variant": "#44474d",
                "error": "#ffb4ab",
                "on-secondary-fixed": "#101b33",
                "primary-fixed": "#d9e2ff",
                "on-background": "#d6e3ff",
                "inverse-primary": "#545e79",
                "tertiary": "#38debb",
                "surface-tint": "#bcc6e5",
                "on-secondary": "#263049",
                "on-error-container": "#ffdad6",
                "tertiary-fixed": "#5ffbd6",
                "on-tertiary-fixed": "#002019",
                "on-primary-container": "#77819e",
                "surface-container-low": "#0d1c32",
                "primary-container": "#0e1830",
                "on-tertiary-fixed-variant": "#005142",
                "secondary": "#bcc6e6",
                "surface-container-high": "#1c2a41",
                "surface": "#041329",
                "on-secondary-container": "#aab4d4",
                "on-surface": "#d6e3ff",
                "tertiary-fixed-dim": "#38debb",
                "on-secondary-fixed-variant": "#3c4661",
                "error-container": "#93000a",
                "primary": "#bcc6e5",
                "surface-container": "#112036",
                "surface-container-lowest": "#010e24",
                "inverse-on-surface": "#233148",
                "on-primary-fixed-variant": "#3c4660",
                "outline": "#8f9097",
                "surface-dim": "#041329",
                "on-error": "#690005"
              },
              fontFamily: {
                "headline": ["Manrope"],
                "body": ["Inter"],
                "label": ["Inter"]
              },
              borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
            },
          },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1c2a41; border-radius: 10px; }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body select-none">
<!-- TopAppBar -->
<header class="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#041329] dark:bg-[#041329] no-border tonal-layering">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-[#bcc6e5]">menu</span>
<h1 class="font-manrope font-bold tracking-widest uppercase text-[#bcc6e5] text-xl font-black text-[#d6e3ff] tracking-tighter">MONOPOLY</h1>
</div>
<div class="flex items-center">
<div class="w-8 h-8 rounded-full bg-surface-container-high border-2 border-primary-fixed-dim overflow-hidden">
<img alt="Player Profile" class="w-full h-full object-cover" data-alt="minimalist close-up portrait of a professional man in high-end lighting with deep shadows and soft navy background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1BN8OjytQBT9nCPBbSlm7nzUEtdv8R4jVBSx60t7xYBdAa9ocX9Z8GMn-YCsFfVMhq-j69qXul-I6UnKUQmDMH2HW42eo6oLToSOz5bAt6HU9dh_FTKQryfKWtSlyWRke7nPvPb_Zc6Q6eMaFkvURxY9-A37hRMVHBokROQoN1yyld8NrCZXrpPROwTAwi5ZF8p9jtAyJe2_ejFnbnJzwtdR8OVnJ9a2RpZab6HbtfxMxz9bX5PlQqWjLfCAcdbSGQltTTo695dj"/>
</div>
</div>
</header>
<main class="pt-20 pb-40 min-h-screen flex flex-col items-center px-4">
<!-- The Board - Grid 11x11 to simulate standard monopoly board -->
<div class="w-full aspect-square max-w-md relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl">
<!-- Board Canvas -->
<div class="absolute inset-0 grid grid-cols-11 grid-rows-11 gap-0.5 p-0.5">
<!-- TOP ROW -->
<div class="bg-surface-bright flex flex-col items-center justify-end pb-1 border-b-4 border-error">
<span class="text-[6px] font-bold text-on-surface-variant">FREE</span>
</div>
<div class="bg-surface-container-low border-b-4 border-error"></div>
<div class="bg-surface-container-low border-b-4 border-error"></div>
<div class="bg-surface-container-low border-b-4 border-[#ff0000]"></div>
<div class="bg-surface-container-low border-b-4 border-[#ff0000]"></div>
<div class="bg-surface-container-low"></div> <!-- Train -->
<div class="bg-surface-container-low border-b-4 border-[#ffff00]"></div>
<div class="bg-surface-container-low border-b-4 border-[#ffff00]"></div>
<div class="bg-surface-container-low"></div> <!-- Water -->
<div class="bg-surface-container-low border-b-4 border-[#ffff00]"></div>
<div class="bg-surface-bright flex flex-col items-center justify-end pb-1">
<span class="text-[6px] font-bold text-on-surface-variant">JAIL</span>
</div>
<!-- MIDDLE ROWS (Left and Right cells only) -->
<!-- This is simplified for the 10x10 request but using 11x11 layout for visual balance -->
<!-- Row 2-10 -->
<div class="bg-surface-container-low border-r-4 border-[#ff8000]"></div><div class="col-span-9 row-span-9 bg-surface-container-lowest flex flex-col p-4">
<!-- Action Log -->
<div class="flex-1 overflow-y-auto space-y-2 pr-2 mb-4">
<div class="flex items-start gap-2 p-2 rounded-lg bg-surface-container-low">
<span class="material-symbols-outlined text-tertiary text-sm">casino</span>
<p class="text-[10px] text-on-surface-variant"><span class="text-on-surface font-bold">Alex</span> rolled a 7.</p>
</div>
<div class="flex items-start gap-2 p-2 rounded-lg bg-surface-container-low">
<span class="material-symbols-outlined text-primary text-sm">apartment</span>
<p class="text-[10px] text-on-surface-variant"><span class="text-on-surface font-bold">Alex</span> purchased <span class="text-tertiary">Park Place</span> for $350.</p>
</div>
<div class="flex items-start gap-2 p-2 rounded-lg bg-surface-container-low">
<span class="material-symbols-outlined text-error text-sm">payments</span>
<p class="text-[10px] text-on-surface-variant"><span class="text-on-surface font-bold">Jordan</span> paid $50 rent to <span class="text-on-surface font-bold">Alex</span>.</p>
</div>
</div>
<!-- Main Action -->
<div class="flex flex-col items-center gap-4 mt-auto">
<div class="flex gap-4">
<div class="w-10 h-10 bg-surface-bright rounded-lg shadow-inner flex items-center justify-center border border-outline-variant/20">
<div class="grid grid-cols-2 gap-1">
<div class="w-1 h-1 bg-on-surface rounded-full"></div>
<div class="w-1 h-1 bg-on-surface rounded-full"></div>
<div class="w-1 h-1 bg-on-surface rounded-full"></div>
<div class="w-1 h-1 bg-on-surface rounded-full"></div>
</div>
</div>
<div class="w-10 h-10 bg-surface-bright rounded-lg shadow-inner flex items-center justify-center border border-outline-variant/20">
<div class="w-1.5 h-1.5 bg-tertiary rounded-full"></div>
</div>
</div>
<button class="w-full py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-extrabold tracking-widest text-sm shadow-lg active:scale-95 transition-transform uppercase">
                            Roll 2 Dice
                        </button>
</div>
</div><div class="bg-surface-container-low border-l-4 border-[#00ff00]"></div>
<div class="bg-surface-container-low border-r-4 border-[#ff8000]"></div><div class="bg-surface-container-low border-l-4 border-[#00ff00]"></div>
<div class="bg-surface-container-low"></div><div class="bg-surface-container-low border-l-4 border-[#00ff00]"></div>
<div class="bg-surface-container-low border-r-4 border-[#ff8000]"></div><div class="bg-surface-container-low"></div>
<div class="bg-surface-container-low"></div><div class="bg-surface-container-low border-l-4 border-[#0000ff]"></div>
<div class="bg-surface-container-low border-r-4 border-[#800080]"></div><div class="bg-surface-container-low"></div>
<div class="bg-surface-container-low border-r-4 border-[#800080]"></div><div class="bg-surface-container-low border-l-4 border-[#0000ff]"></div>
<div class="bg-surface-container-low"></div><div class="bg-surface-container-low border-l-4 border-[#0000ff]"></div>
<div class="bg-surface-container-low border-r-4 border-[#800080]"></div><div class="bg-surface-container-low border-l-4 border-[#0000ff]"></div>
<!-- BOTTOM ROW -->
<div class="bg-surface-bright flex flex-col items-center justify-center border-t-4 border-primary">
<span class="text-[8px] font-black text-primary">GO</span>
</div>
<div class="bg-surface-container-low border-t-4 border-[#a52a2a]"></div>
<div class="bg-surface-container-low"></div>
<div class="bg-surface-container-low border-t-4 border-[#a52a2a]"></div>
<div class="bg-surface-container-low"></div>
<div class="bg-surface-container-low"></div>
<div class="bg-surface-container-low border-t-4 border-[#87ceeb]"></div>
<div class="bg-surface-container-low"></div>
<div class="bg-surface-container-low border-t-4 border-[#87ceeb]"></div>
<div class="bg-surface-container-low border-t-4 border-[#87ceeb]"></div>
<div class="bg-surface-bright flex flex-col items-center justify-center">
<span class="material-symbols-outlined text-error text-lg">local_police</span>
</div>
</div>
<!-- Player Token Placement (Abstract Representation) -->
<div class="absolute top-[85%] left-[85%] w-4 h-4 rounded-full bg-tertiary ring-2 ring-surface shadow-md"></div>
</div>
<!-- Quick Stats Bento -->
<div class="w-full max-w-md mt-6 grid grid-cols-2 gap-3">
<div class="p-4 rounded-xl bg-surface-container-low flex flex-col">
<span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Properties Owned</span>
<span class="text-2xl font-headline font-extrabold text-on-surface mt-1">12</span>
</div>
<div class="p-4 rounded-xl bg-surface-container-low flex flex-col">
<span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Net Worth</span>
<span class="text-2xl font-headline font-extrabold text-tertiary mt-1">$4,850</span>
</div>
</div>
</main>
<!-- Bottom Player Panel -->
<footer class="fixed bottom-0 w-full z-50 bg-[#0d1c32]/90 backdrop-blur-md px-4 pb-4 pt-4 rounded-t-3xl shadow-[0_-10px_25px_rgba(1,14,36,0.4)] border-t border-[#44474d]/20">
<div class="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar">
<!-- Player 1 (Active) -->
<div class="flex-shrink-0 flex flex-col items-center justify-center bg-[#1c2a41] text-[#38debb] rounded-xl p-3 ring-2 ring-tertiary/30 min-w-[80px]">
<div class="w-10 h-10 rounded-full border-2 border-tertiary overflow-hidden mb-1">
<img alt="Alex" class="w-full h-full object-cover" data-alt="avatar of a young gamer with headphones, vibrant cyan neon lighting accentuating facial features" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGyGc7XwshipCkloikugKo3NmaIq2dFYMEHR1VDa-wMKIVQJ2hC4p6Q_GJqhevOMcn4BMS2SpkBmf93_9UINvbtJz8-4hX-CFIj3qWREzU2n5XSWhb8I05eLXYTfQb5gZyXe1qSZviLyZbxyGed2596ulxccZj_3Zq5oBWmOnn0aJKmETCmjyn15t36gztIZLm3DpCpRNiuQRkknw-beR3sYHl6LkbTQJFLxo3oLndA_BspjfPT8m7fgMLRwhNHLouLwSmxBFWpp7H"/>
</div>
<span class="text-[10px] font-bold truncate w-full text-center">Alex</span>
<span class="text-[12px] font-black text-on-surface">$1,500</span>
</div>
<!-- Player 2 -->
<div class="flex-shrink-0 flex flex-col items-center justify-center text-[#c5c6cd] p-3 min-w-[80px] hover:text-[#d6e3ff]">
<div class="w-10 h-10 rounded-full border border-outline-variant/50 overflow-hidden mb-1 opacity-60">
<img alt="Jordan" class="w-full h-full object-cover" data-alt="minimalist profile photo of a woman with short hair, soft studio lighting, muted grey background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeu8nCHaslhIB78u-61CPeGEtNYWfuxXiYCqcUiDS-DEPxETgEE9dgjAX0mm0KnxigczqKPvcsVtUDDpTOpzlHV-jY5lBOMVDhIxOKon5UepdHi9ZbW3BbKZ8kegR_xhbFOKYup8xIIg7dNTM5Sgf3USm3KiFT97pyjDHigEdNq1oWP49FRkXsXDjQ31VNeSZx6D_Btgy2Ei8DXRuxcTOtVmN9pWjl0lBW7ctjl7AvByyxLiSNwdfJ6-RRN0g8nkZH3iRQgHg9hOvG"/>
</div>
<span class="text-[10px] font-medium truncate w-full text-center">Jordan</span>
<span class="text-[12px] font-bold text-on-surface-variant">$1,240</span>
</div>
<!-- Player 3 -->
<div class="flex-shrink-0 flex flex-col items-center justify-center text-[#c5c6cd] p-3 min-w-[80px] hover:text-[#d6e3ff]">
<div class="w-10 h-10 rounded-full border border-outline-variant/50 overflow-hidden mb-1 opacity-60">
<img alt="Sam" class="w-full h-full object-cover" data-alt="portrait of a man with a beard, high contrast lighting, dark blue monochromatic aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1PxNmL_XFD6u_h8OG2qfZRcxA8lEu2FydPKlj3Qo3XYuNvqxS8m6SMSxj4vwJ3mngl9uVmEtjk-MWI3vWQeY5u8gWEh2EkrXXGSe6223Q5mTkdfF_eFiMVjrxwbO-5_q2fQp41f5fcP5-gp4Oj6ots2FFrcOQEa1XfSu9NMJWKQ4TbwO-5xurAs53pGeo145dgrLIKdcdAE14euhkcP6dmI3lrGImLClyPxsn-sy4hn-K6xDiplnmn7i5hwI5i0JPSUXlr29Z-tme"/>
</div>
<span class="text-[10px] font-medium truncate w-full text-center">Sam</span>
<span class="text-[12px] font-bold text-on-surface-variant">$980</span>
</div>
<!-- Player 4 -->
<div class="flex-shrink-0 flex flex-col items-center justify-center text-[#c5c6cd] p-3 min-w-[80px] hover:text-[#d6e3ff]">
<div class="w-10 h-10 rounded-full border border-outline-variant/50 overflow-hidden mb-1 opacity-60">
<div class="w-full h-full bg-surface-container-high flex items-center justify-center">
<span class="material-symbols-outlined text-sm">person</span>
</div>
</div>
<span class="text-[10px] font-medium truncate w-full text-center">Morgan</span>
<span class="text-[12px] font-bold text-on-surface-variant">$2,100</span>
</div>
</div>
</footer>
<!-- BottomNavBar (Hidden on main gameplay screen as per shell suppression logic but structured for reference) -->
<nav class="hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#0d1c32]/90 backdrop-blur-md rounded-t-3xl border-t border-[#44474d]/20">
<div class="flex flex-col items-center justify-center text-[#c5c6cd] p-3 hover:text-[#d6e3ff]">
<span class="material-symbols-outlined" data-icon="person_3">person_3</span>
</div>
<div class="flex flex-col items-center justify-center text-[#c5c6cd] p-3 hover:text-[#d6e3ff]">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
</div>
<div class="flex flex-col items-center justify-center text-[#c5c6cd] p-3 hover:text-[#d6e3ff]">
<span class="material-symbols-outlined" data-icon="Description">description</span>
</div>
<div class="flex flex-col items-center justify-center text-[#c5c6cd] p-3 hover:text-[#d6e3ff]">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
</div>
</nav>
</body></html>

<!-- Monopoly Web Game - Mobile UI -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "surface": "#041329",
            "primary-container": "#0e1830",
            "on-background": "#d6e3ff",
            "secondary-fixed": "#d9e2ff",
            "surface-container": "#112036",
            "outline": "#8f9097",
            "surface-container-highest": "#27354c",
            "inverse-on-surface": "#233148",
            "tertiary": "#38debb",
            "on-primary-fixed-variant": "#3c4660",
            "on-tertiary-container": "#00937a",
            "on-error": "#690005",
            "on-secondary": "#263049",
            "on-tertiary-fixed-variant": "#005142",
            "tertiary-container": "#001e17",
            "tertiary-fixed-dim": "#38debb",
            "surface-bright": "#2c3951",
            "primary-fixed-dim": "#bcc6e5",
            "surface-container-low": "#0d1c32",
            "surface-dim": "#041329",
            "on-tertiary": "#00382d",
            "surface-variant": "#27354c",
            "on-secondary-container": "#aab4d4",
            "inverse-surface": "#d6e3ff",
            "surface-container-high": "#1c2a41",
            "secondary-fixed-dim": "#bcc6e6",
            "tertiary-fixed": "#5ffbd6",
            "on-primary-container": "#77819e",
            "on-primary": "#263049",
            "on-primary-fixed": "#101b33",
            "on-surface": "#d6e3ff",
            "secondary": "#bcc6e6",
            "primary": "#bcc6e5",
            "surface-tint": "#bcc6e5",
            "inverse-primary": "#545e79",
            "surface-container-lowest": "#010e24",
            "on-tertiary-fixed": "#002019",
            "on-error-container": "#ffdad6",
            "error": "#ffb4ab",
            "on-secondary-fixed": "#101b33",
            "background": "#041329",
            "primary-fixed": "#d9e2ff",
            "outline-variant": "#44474d",
            "secondary-container": "#3c4661",
            "on-secondary-fixed-variant": "#3c4661",
            "on-surface-variant": "#c5c6cd",
            "error-container": "#93000a"
          },
          fontFamily: {
            "headline": ["Manrope"],
            "body": ["Inter"],
            "label": ["Inter"]
          },
          borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
        },
      },
    }
  </script>
<style>
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      display: inline-block;
      line-height: 1;
      text-transform: none;
      letter-spacing: normal;
      word-wrap: normal;
      white-space: nowrap;
      direction: ltr;
    }
    .glass-overlay {
      backdrop-filter: blur(20px);
      background: rgba(4, 19, 41, 0.6);
    }
    .property-card-shadow {
      box-shadow: 0 25px 50px -12px rgba(1, 14, 36, 0.8);
    }
    .minted-gradient-buy {
      background: linear-gradient(135deg, #38debb 0%, #00937a 100%);
    }
    .minted-gradient-auction {
      background: linear-gradient(135deg, #ffb4ab 0%, #93000a 100%);
    }
  </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface font-body text-on-surface selection:bg-tertiary/30">
<!-- Background Content (Blurred Game Board Representation) -->
<main class="fixed inset-0 z-0 flex items-center justify-center blur-sm scale-105 overflow-hidden">
<div class="grid grid-cols-4 grid-rows-4 w-[120vw] h-[1060px] gap-2 opacity-40">
<!-- Simulated Board Tiles -->
<div class="bg-surface-container-low rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl border-t-4 border-blue-500"></div>
<div class="bg-surface-container-high rounded-xl"></div>
<div class="bg-surface-container-high rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl border-t-4 border-yellow-500"></div>
<div class="bg-surface-container-low rounded-xl border-t-4 border-blue-600"></div>
<div class="bg-surface-container-high rounded-xl"></div>
<div class="bg-surface-container-high rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl border-t-4 border-green-500"></div>
<div class="bg-surface-container-low rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl"></div>
<div class="bg-surface-container-low rounded-xl"></div>
</div>
</main>
<!-- Modal Overlay -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
<!-- Modal Container -->
<div class="relative w-full max-w-md bg-surface-container-low rounded-[2rem] overflow-hidden property-card-shadow border border-outline-variant/10">
<!-- TopAppBar Style Header (Simulated for Modal) -->
<header class="flex justify-between items-center px-8 h-16 bg-surface-container-low">
<span class="font-headline font-bold tracking-widest text-on-surface-variant text-sm uppercase">PROPERTY ACQUISITION</span>
<button class="text-on-surface-variant hover:text-on-surface transition-colors">
<span class="material-symbols-outlined">close</span>
</button>
</header>
<!-- Property Card Content -->
<div class="px-8 pb-8 flex flex-col items-center">
<!-- The Property Card Component -->
<div class="w-full bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/20 mb-8">
<!-- Bright Blue Color Bar -->
<div class="h-20 bg-blue-600 flex items-center justify-center">
<div class="bg-white/10 w-full h-full backdrop-blur-sm flex items-center justify-center">
<span class="text-white font-headline font-extrabold text-2xl tracking-tight">TITLE DEED</span>
</div>
</div>
<div class="p-6 text-center">
<h1 class="font-headline font-black text-3xl text-on-surface mb-1 tracking-tight uppercase">Park Place</h1>
<p class="font-label text-on-tertiary-container font-bold text-lg mb-6">$350</p>
<!-- Rent Schedule -->
<div class="space-y-3 text-left w-full">
<div class="flex justify-between items-center py-2 border-b border-outline-variant/10">
<span class="font-label text-on-surface-variant text-sm">Rent</span>
<span class="font-headline font-bold text-on-surface">$35</span>
</div>
<div class="flex justify-between items-center">
<span class="font-label text-on-surface-variant text-sm flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-surface-bright"></span> With 1 House
                </span>
<span class="font-headline font-semibold text-on-surface">$175</span>
</div>
<div class="flex justify-between items-center">
<span class="font-label text-on-surface-variant text-sm flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-surface-bright"></span> With 2 Houses
                </span>
<span class="font-headline font-semibold text-on-surface">$500</span>
</div>
<div class="flex justify-between items-center">
<span class="font-label text-on-surface-variant text-sm flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-surface-bright"></span> With 3 Houses
                </span>
<span class="font-headline font-semibold text-on-surface">$1100</span>
</div>
<div class="flex justify-between items-center">
<span class="font-label text-on-surface-variant text-sm flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-surface-bright"></span> With 4 Houses
                </span>
<span class="font-headline font-semibold text-on-surface">$1300</span>
</div>
<div class="flex justify-between items-center bg-error-container/10 p-2 rounded-lg mt-2">
<span class="font-label text-error font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">hotel</span> Hotel
                </span>
<span class="font-headline font-black text-error text-lg">$1500</span>
</div>
</div>
<!-- Mortgage Note -->
<div class="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col items-center">
<span class="text-[10px] font-label text-on-surface-variant uppercase tracking-[0.2em] mb-1">Mortgage Value</span>
<span class="font-headline font-bold text-on-surface-variant">$175</span>
</div>
</div>
</div>
<!-- Action Buttons Cluster -->
<div class="grid grid-cols-2 gap-4 w-full">
<!-- Buy Button -->
<button class="group relative flex flex-col items-center justify-center py-4 px-6 rounded-2xl minted-gradient-buy transform active:scale-95 transition-all duration-150 shadow-lg shadow-tertiary/10">
<span class="material-symbols-outlined text-on-tertiary mb-1" style="font-variation-settings: 'FILL' 1;">payments</span>
<span class="font-headline font-extrabold text-on-tertiary uppercase tracking-widest text-sm">Buy</span>
<div class="absolute inset-0 rounded-2xl border-2 border-white/10 group-hover:border-white/20 transition-colors"></div>
</button>
<!-- Auction Button -->
<button class="group relative flex flex-col items-center justify-center py-4 px-6 rounded-2xl minted-gradient-auction transform active:scale-95 transition-all duration-150 shadow-lg shadow-error/10">
<span class="material-symbols-outlined text-on-error mb-1">gavel</span>
<span class="font-headline font-extrabold text-on-error uppercase tracking-widest text-sm">Auction</span>
<div class="absolute inset-0 rounded-2xl border-2 border-white/10 group-hover:border-white/20 transition-colors"></div>
</button>
</div>
<p class="mt-6 text-[11px] font-label text-on-surface-variant/60 text-center uppercase tracking-tighter">
          Player 1 currently has $2,450 remaining in liquidity
        </p>
</div>
</div>
</div>
<!-- Bottom Nav Bar (Suppressed but logic followed for background layer feel) -->
<nav class="fixed bottom-0 w-full z-10 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container-low/90 backdrop-blur-md border-t border-outline-variant/10 opacity-30 pointer-events-none">
<div class="flex flex-col items-center justify-center text-on-surface-variant p-3">
<span class="material-symbols-outlined">person_3</span>
</div>
<div class="flex flex-col items-center justify-center text-on-surface-variant p-3">
<span class="material-symbols-outlined">account_balance_wallet</span>
</div>
<div class="flex flex-col items-center justify-center text-on-surface-variant p-3">
<span class="material-symbols-outlined">description</span>
</div>
<div class="flex flex-col items-center justify-center text-on-surface-variant p-3">
<span class="material-symbols-outlined">settings</span>
</div>
</nav>
</body></html>

<!-- Property Purchase Card -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&amp;family=Inter:wght@400;500;600&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "surface": "#041329",
                        "primary-container": "#0e1830",
                        "on-background": "#d6e3ff",
                        "secondary-fixed": "#d9e2ff",
                        "surface-container": "#112036",
                        "outline": "#8f9097",
                        "surface-container-highest": "#27354c",
                        "inverse-on-surface": "#233148",
                        "tertiary": "#38debb",
                        "on-tertiary-container": "#00937a",
                        "on-error": "#690005",
                        "on-secondary": "#263049",
                        "on-tertiary-fixed-variant": "#005142",
                        "tertiary-container": "#001e17",
                        "tertiary-fixed-dim": "#38debb",
                        "surface-bright": "#2c3951",
                        "primary-fixed-dim": "#bcc6e5",
                        "surface-container-low": "#0d1c32",
                        "surface-dim": "#041329",
                        "on-tertiary": "#00382d",
                        "surface-variant": "#27354c",
                        "on-secondary-container": "#aab4d4",
                        "inverse-surface": "#d6e3ff",
                        "surface-container-high": "#1c2a41",
                        "secondary-fixed-dim": "#bcc6e6",
                        "tertiary-fixed": "#5ffbd6",
                        "on-primary-container": "#77819e",
                        "on-primary": "#263049",
                        "on-primary-fixed": "#101b33",
                        "on-surface": "#d6e3ff",
                        "secondary": "#bcc6e6",
                        "primary": "#bcc6e5",
                        "surface-tint": "#bcc6e5",
                        "inverse-primary": "#545e79",
                        "surface-container-lowest": "#010e24",
                        "on-tertiary-fixed": "#002019",
                        "on-error-container": "#ffdad6",
                        "error": "#ffb4ab",
                        "on-secondary-fixed": "#101b33",
                        "background": "#041329",
                        "primary-fixed": "#d9e2ff",
                        "outline-variant": "#44474d",
                        "secondary-container": "#3c4661",
                        "on-secondary-fixed-variant": "#3c4661",
                        "on-surface-variant": "#c5c6cd",
                        "error-container": "#93000a"
                    },
                    fontFamily: {
                        "headline": ["Manrope"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bg-mesh {
            background-color: #041329;
            background-image: 
                radial-gradient(at 0% 0%, hsla(217,100%,10%,1) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(210,50%,15%,1) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(180,50%,10%,1) 0, transparent 50%);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface text-on-surface font-body selection:bg-tertiary/30 overflow-hidden">
<!-- Background Board (Blurred) -->
<div class="fixed inset-0 z-0 blur-xl scale-110 opacity-40 select-none">
<div class="grid grid-cols-11 grid-rows-11 h-screen w-screen p-4 gap-1">
<!-- Mock Monopoly Board Squares for Background Depth -->
<div class="bg-surface-container-high col-span-2 row-span-2 rounded-lg"></div>
<div class="bg-surface-container-low col-span-7 row-span-2 rounded-lg"></div>
<div class="bg-surface-container-high col-span-2 row-span-2 rounded-lg"></div>
<div class="bg-surface-container-low col-span-2 row-span-7 rounded-lg"></div>
<div class="col-span-7 row-span-7 flex items-center justify-center">
<div class="text-9xl font-headline font-black text-on-surface-variant opacity-10 rotate-[-45deg] tracking-tighter">MONOPOLY</div>
</div>
<div class="bg-surface-container-low col-span-2 row-span-7 rounded-lg"></div>
<div class="bg-surface-container-high col-span-2 row-span-2 rounded-lg"></div>
<div class="bg-surface-container-low col-span-7 row-span-2 rounded-lg"></div>
<div class="bg-surface-container-high col-span-2 row-span-2 rounded-lg"></div>
</div>
</div>
<!-- Top App Bar -->
<nav class="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#041329] dark:bg-[#041329]">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-[#bcc6e5]">menu</span>
<span class="font-headline font-black text-[#d6e3ff] tracking-tighter text-xl">MONOPOLY</span>
</div>
<div class="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/30">
<img alt="Player Profile" class="w-full h-full object-cover" data-alt="Stylized avatar icon of a high-end corporate executive in a dark navy suit with subtle neon accents" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjbR9yOUcE-izAnD3p8e5qr2zj1g2LJ6g_tuXVt74H8kIDzmx-qjTYHvwib5DSFORA46BAP1BP6ZiDQ4yPPQBkRj6fWe-axcwF7uJp2pzfRqFuQlKsDuYzp8fHK5447tEtMc_tR8mUoGeQRe_Mi9j_ZqnAoD8hLvnqWgKNBZ9sOeOTcYUNNalNU6PouceEa2Mx2td2xbMWBW85xXsDxb3eWxr1v4kBqS1ZEGJMtBanPb7eTgNLOWmbcENYa6GT3AELWMeO2DSxsRbI"/>
</div>
</nav>
<!-- Modal Overlay -->
<main class="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-surface/60 backdrop-blur-sm">
<!-- Auction Modal Container -->
<div class="relative w-full max-w-2xl bg-surface-container-low/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-outline-variant/10 overflow-hidden">
<!-- Modal Header / Property Highlight -->
<div class="relative h-40 bg-surface-container-lowest overflow-hidden">
<div class="absolute inset-0 opacity-40">
<img alt="Property Image" class="w-full h-full object-cover" data-alt="A luxury dark moody penthouse interior with city lights reflecting in glass walls at night, editorial architectural photography" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJN_T-lybkAMRDX7IUXiHpGSeX1SP0F6_XPYH8I0TzTc7Io8NMmlmVFgyUs6xuFmc80J5M2jERHEaOI2DFajtT5QHUJWm4flQUX37vIK1G13n7MChvx0TPOtYmE4ZeF_gEqMpP1BeMQJQUCja4JlXW2IZKaskVWnYJGWrilhj06K-r6zzzfX0OlQTW2f-BjLdpc3EmCvbQIcZ1N3pmUaIb8gg6SdUcgPgZxey_1yRWFcm8HBjPIA6LgDaELUVw_iPEa4qWTxbia4p2"/>
</div>
<div class="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
<div class="absolute bottom-6 left-8 flex items-end gap-6">
<div class="w-20 h-28 bg-[#38debb] rounded-xl shadow-lg border-4 border-surface-container-lowest flex flex-col justify-between p-2">
<div class="h-4 w-full bg-black/20 rounded-sm"></div>
<div class="flex-1 flex items-center justify-center">
<span class="material-symbols-outlined text-surface text-4xl">apartment</span>
</div>
</div>
<div>
<span class="text-tertiary font-headline font-bold tracking-widest text-xs uppercase">Live Auction</span>
<h2 class="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Park Place</h2>
<p class="text-on-surface-variant text-sm font-medium">Estate Group 8 • Premium Lot</p>
</div>
</div>
<!-- Countdown Timer -->
<div class="absolute top-6 right-8 flex flex-col items-end">
<div class="flex items-center gap-3 bg-error-container/20 px-4 py-2 rounded-full border border-error/20">
<span class="material-symbols-outlined text-error text-xl" style="font-variation-settings: 'FILL' 1;">timer</span>
<span class="text-error font-headline font-black text-xl tabular-nums">15s</span>
</div>
</div>
</div>
<!-- Modal Content -->
<div class="p-8 space-y-8">
<!-- Current Bid Display -->
<div class="flex flex-col items-center justify-center py-6 rounded-3xl bg-surface-container-high/40 border border-outline-variant/5">
<span class="text-on-surface-variant font-label text-sm uppercase tracking-[0.2em] mb-1">Current Bid</span>
<div class="flex items-baseline gap-2">
<span class="text-tertiary font-headline font-bold text-2xl">$</span>
<span class="text-6xl font-headline font-black text-on-surface tracking-tighter">450</span>
</div>
</div>
<!-- Participants Grid -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<!-- Participant 1 (Current Leader) -->
<div class="bg-surface-bright rounded-2xl p-4 border border-tertiary/30 ring-1 ring-tertiary/10">
<div class="flex justify-between items-start mb-3">
<div class="h-10 w-10 rounded-full bg-tertiary/20 flex items-center justify-center border border-tertiary/40">
<span class="material-symbols-outlined text-tertiary">person</span>
</div>
<span class="flex h-2 w-2 rounded-full bg-tertiary"></span>
</div>
<p class="font-headline font-bold text-on-surface text-sm">Alex</p>
<p class="text-tertiary font-label text-[10px] font-bold uppercase tracking-wider">High Bidder</p>
</div>
<!-- Participant 2 -->
<div class="bg-surface-container-high rounded-2xl p-4 border border-outline-variant/10">
<div class="flex justify-between items-start mb-3">
<div class="h-10 w-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
<span class="material-symbols-outlined text-on-surface-variant">person</span>
</div>
<span class="flex h-2 w-2 rounded-full bg-outline"></span>
</div>
<p class="font-headline font-bold text-on-surface text-sm">Jordan</p>
<p class="text-on-surface-variant font-label text-[10px] uppercase tracking-wider">Waiting...</p>
</div>
<!-- Participant 3 -->
<div class="bg-surface-container-high rounded-2xl p-4 border border-outline-variant/10">
<div class="flex justify-between items-start mb-3">
<div class="h-10 w-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
<span class="material-symbols-outlined text-on-surface-variant">person</span>
</div>
<span class="flex h-2 w-2 rounded-full bg-outline"></span>
</div>
<p class="font-headline font-bold text-on-surface text-sm">Sam</p>
<p class="text-on-surface-variant font-label text-[10px] uppercase tracking-wider">Thinking</p>
</div>
<!-- Participant 4 (Passed) -->
<div class="bg-surface-container-lowest/50 rounded-2xl p-4 border border-outline-variant/5 grayscale">
<div class="flex justify-between items-start mb-3">
<div class="h-10 w-10 rounded-full bg-surface-container-highest flex items-center justify-center opacity-50">
<span class="material-symbols-outlined text-on-surface-variant">person</span>
</div>
<span class="flex h-2 w-2 rounded-full bg-error"></span>
</div>
<p class="font-headline font-bold text-on-surface-variant text-sm">Morgan</p>
<p class="text-error font-label text-[10px] font-bold uppercase tracking-wider">Passed</p>
</div>
</div>
<!-- Bid Controls -->
<div class="space-y-4">
<div class="grid grid-cols-3 gap-3">
<button class="flex flex-col items-center justify-center py-4 bg-surface-container-high hover:bg-surface-bright transition-all active:scale-95 rounded-2xl border border-outline-variant/20 group">
<span class="text-[10px] font-label font-bold text-on-primary-container uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Increment</span>
<span class="text-xl font-headline font-black text-primary">+$50</span>
</button>
<button class="flex flex-col items-center justify-center py-4 bg-surface-container-high hover:bg-surface-bright transition-all active:scale-95 rounded-2xl border border-outline-variant/20 group">
<span class="text-[10px] font-label font-bold text-on-primary-container uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Standard</span>
<span class="text-xl font-headline font-black text-primary">+$100</span>
</button>
<button class="flex flex-col items-center justify-center py-4 bg-surface-container-high hover:bg-surface-bright transition-all active:scale-95 rounded-2xl border border-outline-variant/20 group">
<span class="text-[10px] font-label font-bold text-on-primary-container uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Power Bid</span>
<span class="text-xl font-headline font-black text-primary">+$500</span>
</button>
</div>
<div class="flex gap-4">
<button class="flex-1 py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-extrabold text-lg rounded-2xl shadow-xl active:scale-[0.98] transition-all">
                            Place Custom Bid
                        </button>
<button class="px-10 py-5 bg-surface-container-highest hover:bg-error/10 hover:text-error hover:border-error/30 transition-all text-on-surface-variant font-headline font-bold rounded-2xl border border-outline-variant/20">
                            Pass
                        </button>
</div>
</div>
</div>
<!-- Bottom Accent Line -->
<div class="h-1.5 w-full bg-gradient-to-r from-transparent via-tertiary/20 to-transparent"></div>
</div>
</main>
<!-- Bottom Nav Bar -->
<nav class="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#0d1c32]/90 backdrop-blur-md rounded-t-3xl border-t border-[#44474d]/20 shadow-[0_-10px_25px_rgba(1,14,36,0.4)]">
<div class="flex flex-col items-center justify-center text-[#c5c6cd] p-3 hover:text-[#d6e3ff]">
<span class="material-symbols-outlined">person_3</span>
</div>
<div class="flex flex-col items-center justify-center text-[#c5c6cd] p-3 hover:text-[#d6e3ff]">
<span class="material-symbols-outlined">account_balance_wallet</span>
</div>
<!-- Active Tab: Auction is a focused activity, so we could argue this is the 'Description'/Board state -->
<div class="flex flex-col items-center justify-center bg-[#1c2a41] text-[#38debb] rounded-xl p-3">
<span class="material-symbols-outlined">description</span>
</div>
<div class="flex flex-col items-center justify-center text-[#c5c6cd] p-3 hover:text-[#d6e3ff]">
<span class="material-symbols-outlined">settings</span>
</div>
</nav>
</body></html>