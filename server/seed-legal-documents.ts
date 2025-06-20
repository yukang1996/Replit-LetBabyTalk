
import { db } from "./db";
import { legalDocuments } from "@shared/schema";

const initialLegalDocuments = [
  {
    type: "terms",
    locale: "en",
    title: "Terms and Conditions",
    content: `
      <h1>Terms and Conditions</h1>
      <p>Welcome to LetBabyTalk. By using our service, you agree to these terms.</p>
      <h2>1. Service Description</h2>
      <p>LetBabyTalk provides AI-powered baby cry analysis to help parents understand their baby's needs.</p>
      <h2>2. User Responsibilities</h2>
      <p>Users are responsible for providing accurate information and using the service appropriately.</p>
      <h2>3. Privacy</h2>
      <p>Your privacy is important to us. Please review our Privacy Policy.</p>
      <h2>4. Limitation of Liability</h2>
      <p>LetBabyTalk is not a medical service. Always consult healthcare professionals for medical concerns.</p>
    `,
    isActive: true,
    version: "v1.0"
  },
  {
    type: "privacy",
    locale: "en", 
    title: "Privacy Policy",
    content: `
      <h1>Privacy Policy</h1>
      <p>This Privacy Policy describes how LetBabyTalk collects, uses, and protects your information.</p>
      <h2>1. Information We Collect</h2>
      <p>We collect audio recordings, user profiles, and usage data to provide our service.</p>
      <h2>2. How We Use Your Information</h2>
      <p>Your information is used to analyze baby cries and improve our service.</p>
      <h2>3. Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information.</p>
      <h2>4. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us.</p>
    `,
    isActive: true,
    version: "v1.0"
  },
  {
    type: "terms",
    locale: "id",
    title: "Syarat dan Ketentuan",
    content: `
      <h1>Syarat dan Ketentuan</h1>
      <p>Selamat datang di LetBabyTalk. Dengan menggunakan layanan kami, Anda setuju dengan syarat-syarat ini.</p>
      <h2>1. Deskripsi Layanan</h2>
      <p>LetBabyTalk menyediakan analisis tangisan bayi bertenaga AI untuk membantu orang tua memahami kebutuhan bayi mereka.</p>
      <h2>2. Tanggung Jawab Pengguna</h2>
      <p>Pengguna bertanggung jawab untuk memberikan informasi yang akurat dan menggunakan layanan dengan tepat.</p>
      <h2>3. Privasi</h2>
      <p>Privasi Anda penting bagi kami. Silakan tinjau Kebijakan Privasi kami.</p>
    `,
    isActive: true,
    version: "v1.0"
  }
];

async function seedLegalDocuments() {
  try {
    console.log("Seeding legal documents...");
    
    // Check if data already exists
    const existingCount = await db.select().from(legalDocuments);
    if (existingCount.length >= initialLegalDocuments.length) {
      console.log("Legal documents already seeded!");
      return;
    }
    
    for (const doc of initialLegalDocuments) {
      await db.insert(legalDocuments)
        .values(doc)
        .onConflictDoNothing();
    }
    
    console.log("Legal documents seeded successfully!");
  } catch (error) {
    console.error("Error seeding legal documents:", error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedLegalDocuments();
}

export { seedLegalDocuments };
