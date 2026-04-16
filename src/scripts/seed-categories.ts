import { db } from "@/db";
import { categories } from "@/db/schema";

const categoryNames = [
  "Gaming",
  "Music",
  "Entertainment",
  "Comedy",
  "Film & Animation",
  "Education",
  "Science & Technology",
  "Programming",
  "AI & Machine Learning",
  "Business & Entrepreneurship",
  "News & Politics",
  "Sports",
  "Travel & Events",
  "Lifestyle",
  "Self Improvement",
  "People & Blogs",
  "Pets & Animals",
  "Cars & Vehicles",
];

async function main() {
    console.log(process.env.DATABASE_URL);
  console.log("Seeding categories...");

  try {
    const values = categoryNames.map((name) => ({
      name,
      description: `Videos related to ${name.toLowerCase()}`,
    }));

    await db.insert(categories).values(values);

    console.log("Categores seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories: ", error);
    process.exit(1);
  }
}

main();
