import { db } from "@/lib/db";
import { orders, products, transactions } from "@/lib/db/schema";
import { faker } from "@faker-js/faker";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

async function main() {
  // Run migrations first
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("✓ Migrations applied");

  // Wipe existing business data
  await db.delete(transactions);
  await db.delete(orders);
  await db.delete(products);
  console.log("✓ Cleared existing data");

  const CATEGORIES = [
    "Electronics",
    "Clothing",
    "Food & Beverages",
    "Home & Garden",
    "Sports",
    "Books",
    "Toys",
  ];

  // --- Products ---
  const productData = CATEGORIES.flatMap((cat) =>
    Array.from({ length: 15 }, () => ({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      category: cat,
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      stock: faker.number.int({ min: 0, max: 500 }),
    }))
  );
  await db.insert(products).values(productData);
  console.log(`✓ Inserted ${productData.length} products`);

  // --- Orders (last 12 months) ---
  const now = new Date();
  const orderData: (typeof orders.$inferInsert)[] = [];
  const transactionData: (typeof transactions.$inferInsert)[] = [];

  for (let i = 0; i < 1500; i++) {
    const product = faker.helpers.arrayElement(productData);
    const daysAgo = faker.number.int({ min: 0, max: 365 });
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - daysAgo);
    const dateStr = orderDate.toISOString().slice(0, 10);
    const monthStr = orderDate.toISOString().slice(0, 7);

    const quantity = faker.number.int({ min: 1, max: 5 });
    const amount = parseFloat((product.price * quantity).toFixed(2));
    const status = faker.helpers.weightedArrayElement([
      { weight: 70, value: "completed" as const },
      { weight: 15, value: "pending" as const },
      { weight: 10, value: "cancelled" as const },
      { weight: 5, value: "refunded" as const },
    ]);

    const order: typeof orders.$inferInsert = {
      id: faker.string.uuid(),
      customerId: faker.string.uuid(),
      customerName: faker.person.fullName(),
      productId: product.id,
      productName: product.name,
      category: product.category,
      amount,
      quantity,
      status,
      date: dateStr,
      month: monthStr,
    };
    orderData.push(order);

    // Create corresponding transaction
    const txType =
      status === "refunded"
        ? ("refund" as const)
        : status === "cancelled"
          ? ("return" as const)
          : ("sale" as const);

    transactionData.push({
      id: faker.string.uuid(),
      orderId: order.id,
      type: txType,
      amount: txType === "sale" ? amount : -amount,
      date: dateStr,
      month: monthStr,
      category: product.category,
    });
  }

  // Batch insert
  for (let i = 0; i < orderData.length; i += 200) {
    await db.insert(orders).values(orderData.slice(i, i + 200));
  }
  console.log(`✓ Inserted ${orderData.length} orders`);

  for (let i = 0; i < transactionData.length; i += 200) {
    await db.insert(transactions).values(transactionData.slice(i, i + 200));
  }
  console.log(`✓ Inserted ${transactionData.length} transactions`);

  console.log("\n🎉 Seed complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
