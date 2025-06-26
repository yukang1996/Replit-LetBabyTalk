
import { db } from "./db";
import { cryReasonDescriptions } from "@shared/schema";

const cryReasons = [
  {
    className: "hunger_food",
    title: "Hunger (Food)",
    description: "Your baby is hungry and needs solid food. This type of cry usually occurs when it's been 2-3 hours since the last meal.",
    recommendations: [
      "Try offering solid food if baby is eating solids",
      "Check if it's been 2-3 hours since last meal",
      "Ensure baby is in comfortable position for feeding"
    ]
  },
  {
    className: "hunger_milk",
    title: "Hunger (Milk)",
    description: "Your baby is hungry and needs milk or formula. This is one of the most common reasons babies cry.",
    recommendations: [
      "Try feeding if it's been more than 2 hours",
      "Check if baby is showing hunger cues",
      "Ensure proper latch if breastfeeding"
    ]
  },
  {
    className: "sleepiness",
    title: "Sleepiness",
    description: "Your baby is tired and needs to sleep. Overtired babies can become fussy and harder to settle.",
    recommendations: [
      "Create a calm, dark environment",
      "Try gentle rocking or swaddling",
      "Check if it's nap time or bedtime"
    ]
  },
  {
    className: "lack_of_security",
    title: "Need for Comfort",
    description: "Your baby needs comfort and security. They may want to be held or soothed.",
    recommendations: [
      "Try holding and cuddling your baby",
      "Use gentle rocking or swaying motions",
      "Speak or sing softly to your baby"
    ]
  },
  {
    className: "diaper_urine",
    title: "Wet Diaper",
    description: "Your baby has a wet diaper and needs to be changed. This discomfort can cause fussiness.",
    recommendations: [
      "Check and change diaper if wet",
      "Clean baby gently and thoroughly",
      "Apply diaper cream if needed"
    ]
  },
  {
    className: "diaper_bowel",
    title: "Soiled Diaper",
    description: "Your baby has a soiled diaper that needs immediate attention.",
    recommendations: [
      "Check and change diaper immediately",
      "Clean baby thoroughly with wipes",
      "Allow some diaper-free time if possible"
    ]
  },
  {
    className: "internal_pain",
    title: "Internal Pain",
    description: "Your baby may be experiencing internal discomfort such as gas, colic, or digestive issues.",
    recommendations: [
      "Check for signs of colic or gas",
      "Try gentle tummy massage",
      "Consider consulting pediatrician if persistent"
    ]
  },
  {
    className: "external_pain",
    title: "External Pain",
    description: "Your baby may be experiencing external pain or discomfort from injuries or irritation.",
    recommendations: [
      "Check for any visible injuries or irritation",
      "Look for tight clothing or hair wrapped around fingers/toes",
      "Consult pediatrician if cause unknown"
    ]
  },
  {
    className: "physical_discomfort",
    title: "Physical Discomfort",
    description: "Your baby is uncomfortable due to physical factors like temperature, clothing, or position.",
    recommendations: [
      "Check room temperature and clothing",
      "Look for tags or rough fabric",
      "Try changing baby's position"
    ]
  },
  {
    className: "unmet_needs",
    title: "Unmet Needs",
    description: "Your baby has other needs that haven't been met, such as stimulation or attention.",
    recommendations: [
      "Try interacting with your baby",
      "Check if baby needs stimulation or quiet time",
      "Consider if baby needs a change of scenery"
    ]
  },
  {
    className: "breathing_difficulties",
    title: "Breathing Difficulties",
    description: "Your baby may be having trouble breathing due to congestion or other respiratory issues.",
    recommendations: [
      "Check for nasal congestion",
      "Ensure proper air circulation",
      "Consult pediatrician immediately if breathing seems labored"
    ]
  },
  {
    className: "normal",
    title: "Normal Fussiness",
    description: "Your baby is experiencing normal fussiness without a specific urgent need.",
    recommendations: [
      "Try general comfort measures",
      "Check if baby needs attention or stimulation",
      "Sometimes babies just need to cry"
    ]
  },
  {
    className: "no_cry_detected",
    title: "No Cry Detected",
    description: "No crying was detected in this audio recording.",
    recommendations: [
      "No cry was detected in this recording",
      "Try recording again when baby is crying",
      "Ensure microphone is close to baby"
    ]
  }
];

async function seedCryReasons() {
  try {
    console.log("Seeding cry reason descriptions...");
    
    // Check if data already exists
    const existingCount = await db.select().from(cryReasonDescriptions);
    console.log("Existing cry reason descriptions count:", existingCount.length);
    console.log("Target cry reasons count:", cryReasons.length);
    
    if (existingCount.length >= cryReasons.length) {
      console.log("Cry reason descriptions already seeded!");
      // Log existing class names for debugging
      const existingClassNames = existingCount.map(r => r.className);
      console.log("Existing class names:", existingClassNames);
      return;
    }
    
    for (const reason of cryReasons) {
      console.log("Seeding cry reason:", reason.className);
      await db.insert(cryReasonDescriptions)
        .values(reason)
        .onConflictDoUpdate({
          target: cryReasonDescriptions.className,
          set: {
            title: reason.title,
            description: reason.description,
            recommendations: reason.recommendations,
            updatedAt: new Date()
          }
        });
    }
    
    console.log("Cry reason descriptions seeded successfully!");
  } catch (error) {
    console.error("Error seeding cry reason descriptions:", error);
  } finally {
    // Don't close the connection as it's shared with the main app
    // The connection will be managed by the main application
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCryReasons();
}

export { seedCryReasons };
