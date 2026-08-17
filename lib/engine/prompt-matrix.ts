export interface GeneratedPrompt {
  categorySlug: string;
  sanitizedSubject: string;
  prompt: string;
}

export class PromptMatrix {
  
  // === CATEGORIES (NON-HUMAN TO AVOID MODEL RELEASE ISSUES) ===

  private static TACTILE_BACKGROUNDS = [
    "a close-up macro shot of rough textured architectural concrete",
    "a minimalist background of recycled organic paper fibers",
    "a limewash plaster wall with subtle uneven textures and a single sharp shadow cast from a window",
    "a highly detailed macro of woven organic canvas fabric",
    "a dark moody background of cracked volcanic rock texture",
    "a smooth terrazzo floor surface with speckled natural stones",
    "a close-up of deeply weathered rusted metal paneling",
    "a pristine white marble slab with subtle grey veining",
    "an abstract arrangement of translucent frosted glass blocks",
    "a macro shot of raw unvarnished oak wood grain"
  ];

  private static REMOTE_WORK_OBJECTS = [
    "a modern digital nomad's open laptop sitting on a rustic table in an empty indie cafe",
    "a home office desk naturally integrated into a cozy living room corner with a potted monstera plant",
    "a sleek mechanical keyboard next to a blurred ceramic coffee cup in the foreground",
    "a minimalist workspace featuring a tablet, a stylus, and an open notebook with scattered sketches",
    "a vintage leather briefcase resting against a modern glass desk",
    "a neat arrangement of colorful sticky notes on a corkboard in a startup office",
    "a smart home speaker sitting on a floating wooden shelf next to a stack of design books",
    "a professional podcasting microphone on an arm stand in a soundproofed home studio",
    "an ergonomic office chair positioned in front of a wide curved monitor displaying data charts",
    "a sleek stainless steel thermos flask next to a pair of wireless headphones on a clean desk"
  ];

  private static GREEN_TECH = [
    "a futuristic EV charging station integrated into a rustic rural landscape",
    "a macro shot of a single green seedling sprouting from cracked dry earth",
    "a sleek wind turbine blade close-up against a dramatic storm sky",
    "an architectural rendering of a smart home covered in vertical green gardens",
    "a close-up of monocrystalline solar panels reflecting a vibrant sunset",
    "a modern electric bicycle parked against a mossy brick wall",
    "a reusable bamboo coffee cup placed on a natural stone surface",
    "a drone spraying organic fertilizer over a lush green vineyard",
    "a smart thermostat glowing on a minimalist wall showing eco-friendly temperature settings",
    "an abstract shot of clean blue water flowing through a modern filtration pipe"
  ];

  private static CINEMATIC_STILL_LIFE = [
    "a vintage vinyl record player spinning on a textured wooden credenza",
    "a classic analog film camera resting on a cluttered designer's desk",
    "a neon sign buzzing faintly on a rain-slicked city street corner",
    "a steaming cup of matcha latte on a dark slate coaster",
    "an artisanal bread loaf fresh out of the oven in a rustic country kitchen",
    "a sharp Damascus steel chef knife cutting fresh organic vegetables on a thick wooden board",
    "a pair of worn-in leather boots sitting on a wet concrete floor",
    "an intricate mechanical watch movement exposed under a magnifying glass",
    "a collection of old hardcover books stacked haphazardly in a dim library",
    "a single lit candle flickering on a dark metallic tray"
  ];

  private static LIGHTINGS = [
    "dramatic cinematic lighting", "soft diffused natural morning daylight", 
    "warm golden hour sunlight", "moody low-key chiaroscuro lighting", 
    "neon cyberpunk rim lighting", "harsh midday direct flash",
    "ethereal volumetric window light", "cool blue twilight ambient light"
  ];
  
  private static CAMERAS = [
    "Shot on 85mm f/1.4 portrait lens", "Macro photography", 
    "Wide angle 24mm documentary style", "Tilt-shift photography",
    "Telephoto 200mm compression", "Drone aerial perspective",
    "Shot on 50mm standard prime lens"
  ];
  
  private static EFFECTS = [
    "heavy analog film grain, light leaks", "VHS aesthetic, slight color shift", 
    "dusty lens effect, authentic snapshot", "clean and sharp, 8k resolution, commercial grade",
    "Kodak Portra 400 film emulation", "Fujifilm Provia 100F vibrant colors",
    "moody cinematic color grading", "monochrome black and white high contrast"
  ];

  /**
   * Generates a completely unique, highly commercial prompt.
   * Total mathematical combinations > 10,000+
   */
  public static generate(): GeneratedPrompt {
    const categories = [
      { name: "Tactile Backgrounds", array: this.TACTILE_BACKGROUNDS, slug: "tactile" },
      { name: "Remote Work Objects", array: this.REMOTE_WORK_OBJECTS, slug: "remote-work" },
      { name: "Green Tech ESG", array: this.GREEN_TECH, slug: "green-tech" },
      { name: "Cinematic Still Life", array: this.CINEMATIC_STILL_LIFE, slug: "cinematic-object" }
    ];

    const category = categories[Math.floor(Math.random() * categories.length)];
    const subject = category.array[Math.floor(Math.random() * category.array.length)];
    const lighting = this.LIGHTINGS[Math.floor(Math.random() * this.LIGHTINGS.length)];
    const camera = this.CAMERAS[Math.floor(Math.random() * this.CAMERAS.length)];
    const effect = this.EFFECTS[Math.floor(Math.random() * this.EFFECTS.length)];

    const prompt = `RAW unedited photograph of ${subject}. ${lighting}. ${camera}. ${effect}. 100% photorealistic, everyday life, unretouched, real world, highly detailed, sharp focus. NO CGI, NO 3d render.`;

    const sanitizedSubject = subject
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
