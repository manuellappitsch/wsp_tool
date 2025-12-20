'use server'

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function placeClickAndCollectOrder(productId: string, quantity: number = 1) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const product = await db.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return { success: false, message: "Product not found" };
        }

        // Calculate generic pickup date (e.g., tomorrow or next training)
        // For simplicity, we set it to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const order = await db.order.create({
            data: {
                userId: session.user.id,
                status: "PENDING",
                pickupDate: tomorrow,
                totalAmount: Number(product.price) * quantity,
                items: {
                    create: {
                        productId: product.id,
                        quantity: quantity,
                        unitPrice: product.price,
                    },
                },
            },
        });

        revalidatePath("/user/shop");
        return { success: true, message: "Order placed successfully!", orderId: order.id };
    } catch (error) {
        console.error("Shop Error:", error);
        return { success: false, message: "Failed to place order." };
    }
}
