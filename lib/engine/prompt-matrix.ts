export interface GeneratedPrompt {
  categorySlug: string;
  sanitizedSubject: string;
  prompt: string;
}

export class PromptMatrix {
  
  // === DYNAMIC CATEGORIES (NON-HUMAN) ===
  
  private static CATEGORIES = [
    {
      slug: "tactile-texture",
      adjectives: ["close-up macro shot of", "highly detailed macro of", "abstract arrangement of", "minimalist background of", "dark moody background of", "pristine surface of"],
      subjects: ["rough textured architectural concrete", "recycled organic paper fibers", "limewash plaster wall", "cracked volcanic rock", "deeply weathered rusted metal", "smooth terrazzo floor", "white marble slab", "raw unvarnished oak wood grain", "translucent frosted glass blocks", "woven organic canvas fabric", "brushed aluminum panel", "crumpled gold foil", "oxidized copper plate", "geometric acoustic foam", "wet river stones"],
      settings: ["with subtle uneven textures", "with speckled natural stones", "with subtle grey veining", "illuminated by a single sharp shadow", "showing deep crevices", "with soft ambient gradients", "reflecting dim light", "with high contrast relief", "under intense macro lighting", "arranged in a repeating pattern"]
    },
    {
      slug: "remote-work",
      adjectives: ["sleek", "modern", "minimalist", "vintage leather", "neat arrangement of", "professional", "ergonomic", "futuristic", "compact", "organized"],
      subjects: ["digital nomad's open laptop", "mechanical keyboard", "tablet and stylus", "briefcase", "colorful sticky notes", "smart home speaker", "podcasting microphone", "office chair", "stainless steel thermos flask", "wireless noise-canceling headphones", "curved ultrawide monitor", "bamboo desk organizer", "coffee mug", "blue light blocking glasses", "analog desk clock"],
      settings: ["on a rustic table in an empty indie cafe", "integrated into a cozy living room corner", "next to a blurred ceramic cup in the foreground", "with an open notebook and scattered sketches", "resting against a modern glass desk", "on a corkboard in a startup office", "on a floating wooden shelf", "in a soundproofed home studio", "positioned in front of data charts", "on a clean uncluttered desk", "bathed in afternoon sunlight", "in a moody late-night coding environment"]
    },
    {
      slug: "green-tech",
      adjectives: ["futuristic", "sleek", "modern", "reusable", "organic", "smart", "sustainable", "eco-friendly", "innovative", "biodegradable"],
      subjects: ["EV charging station", "green seedling sprouting", "wind turbine blade", "monocrystalline solar panels", "electric bicycle", "bamboo coffee cup", "agricultural drone", "smart thermostat", "clean water filtration pipe", "hydroponic indoor garden", "solar-powered street light", "compostable packaging", "smart grid meter", "vertical farm module", "algae bioreactor"],
      settings: ["integrated into a rustic rural landscape", "sprouting from cracked dry earth", "against a dramatic storm sky", "reflecting a vibrant sunset", "parked against a mossy brick wall", "placed on a natural stone surface", "spraying fertilizer over a lush vineyard", "glowing on a minimalist wall", "with flowing crystal clear water", "surrounded by lush vegetation", "in a futuristic eco-city", "illuminated by green LED indicators"]
    },
    {
      slug: "cinematic-object",
      adjectives: ["vintage", "classic analog", "steaming", "artisanal", "sharp Damascus steel", "intricate mechanical", "old hardcover", "single lit", "antique", "retro"],
      subjects: ["vinyl record player", "film camera", "neon sign", "cup of matcha latte", "bread loaf", "chef knife", "worn-in leather boots", "watch movement", "collection of books", "candle", "brass compass", "typewriter", "fountain pen", "pocket watch", "crystal whiskey decanter"],
      settings: ["spinning on a textured wooden credenza", "resting on a cluttered designer's desk", "buzzing faintly on a rain-slicked city street corner", "on a dark slate coaster", "fresh out of the oven in a rustic country kitchen", "cutting fresh vegetables on a thick wooden board", "sitting on a wet concrete floor", "exposed under a magnifying glass", "stacked haphazardly in a dim library", "flickering on a dark metallic tray", "on a velvet cloth", "surrounded by scattered handwritten notes"]
    },
    {
      slug: "culinary-art",
      adjectives: ["mouth-watering", "freshly baked", "gourmet", "rustic", "decadent", "vibrant", "steaming", "chilled", "spicy", "artisan"],
      subjects: ["sourdough bread", "chocolate lava cake", "bowl of tonkotsu ramen", "wood-fired margherita pizza", "avocado toast", "glass of red wine", "sushi platter", "fruit tart", "espresso shot", "grilled ribeye steak", "stacked beef burger", "bowl of fresh berries", "creamy pasta dish", "colorful macaron tower", "craft beer pint"],
      settings: ["on a dark moody slate board", "on a sunlit white marble counter", "in a cozy dimly lit restaurant", "with scattered flour on a wooden baking table", "on a rustic farmhouse dining table", "garnished with fresh herbs", "with steam rising in the background", "next to elegant silver cutlery", "on a checkered picnic blanket", "with a bokeh backdrop of string lights"]
    },
    {
      slug: "health-wellness",
      adjectives: ["calming", "minimalist", "holistic", "organic", "soothing", "energizing", "pure", "natural", "zen", "therapeutic"],
      subjects: ["yoga mat", "essential oil diffuser", "himalayan salt lamp", "stack of smooth massage stones", "bamboo water bottle", "bowl of matcha powder", "bunch of dried lavender", "singing bowl", "skincare serum bottle", "herbal tea cup", "fitness kettlebell", "meditation cushion", "jade roller", "bamboo toothbrush", "aloe vera plant"],
      settings: ["in a sun-drenched minimalist studio", "on a clean white wooden floor", "surrounded by tropical house plants", "next to a flowing indoor water feature", "on a soft linen towel", "with soft morning light filtering through blinds", "on a polished bamboo tray", "in a serene spa environment", "with a blurry background of a peaceful garden", "on a raw stone surface"]
    }
  ];

  private static LIGHTINGS = [
    "dramatic cinematic lighting", "soft diffused natural morning daylight", 
    "warm golden hour sunlight", "moody low-key chiaroscuro lighting", 
    "neon cyberpunk rim lighting", "harsh midday direct flash",
    "ethereal volumetric window light", "cool blue twilight ambient light",
    "soft bioluminescent glow", "high-key studio lighting with softboxes"
  ];
  
  private static CAMERAS = [
    "Shot on 85mm f/1.4 portrait lens", "Macro photography", 
    "Wide angle 24mm documentary style", "Tilt-shift photography",
    "Telephoto 200mm compression", "Drone aerial perspective",
    "Shot on 50mm standard prime lens", "Shot on 35mm f/1.8 street lens"
  ];
  
  private static EFFECTS = [
    "heavy analog film grain, light leaks", "VHS aesthetic, slight color shift", 
    "dusty lens effect, authentic snapshot", "clean and sharp, 8k resolution, commercial grade",
    "Kodak Portra 400 film emulation", "Fujifilm Provia 100F vibrant colors",
    "moody cinematic color grading", "monochrome black and white high contrast",
    "vibrant hyper-realistic colors", "desaturated muted color palette"
  ];

  /**
   * Generates a completely unique, highly commercial prompt.
   * Total mathematical combinations > 10,000,000+
   */
  public static generate(): GeneratedPrompt {
    const category = this.CATEGORIES[Math.floor(Math.random() * this.CATEGORIES.length)];
    
    const adj = category.adjectives[Math.floor(Math.random() * category.adjectives.length)];
    const subj = category.subjects[Math.floor(Math.random() * category.subjects.length)];
    const set = category.settings[Math.floor(Math.random() * category.settings.length)];
    
    // Combine to create the core subject phrase
    const coreSubject = `a ${adj} ${subj} ${set}`;
    
    const lighting = this.LIGHTINGS[Math.floor(Math.random() * this.LIGHTINGS.length)];
    const camera = this.CAMERAS[Math.floor(Math.random() * this.CAMERAS.length)];
    const effect = this.EFFECTS[Math.floor(Math.random() * this.EFFECTS.length)];

    const prompt = `RAW unedited photograph of ${coreSubject}. ${lighting}. ${camera}. ${effect}. 100% photorealistic, everyday life, unretouched, real world, highly detailed, sharp focus. NO CGI, NO 3d render.`;

    const sanitizedSubject = `${adj}-${subj}`
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .substring(0, 45); // Trim to a safe filename length

    return {
      categorySlug: category.slug,
      sanitizedSubject,
      prompt
    };
  }
}

