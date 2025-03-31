import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { capturePaymentWorkflow } from "@medusajs/medusa/core-flows"

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    try {
        const container = req.scope
        const params = req.body as Record<string, any>;
        const cartId = params.Details2;

        const successUrl = params.Details1.split(", ")[1];

        const query = container.resolve("query")
        const { data: carts } = await query.graph({
            entity: "cart",
            fields: [
                "payment_collection.payments.*",
            ],
            filters: {
                id: cartId
            }
        })

        if (carts && carts.length > 0) {
            const cart = carts[0]
            if (cart.payment_collection && cart.payment_collection.payments) {
                if (cart.payment_collection.payments.length > 0) {
                    const paymentId = cart.payment_collection.payments[0].id
                    const { result } = await capturePaymentWorkflow(req.scope)
                        .run({
                            input: {
                                payment_id: paymentId
                            }
                        })


                }
            } else {
                console.log("No payment collection or payments found for this cart")
            }
        } else {
            console.log("No cart found with ID:", cartId)

        }

        res.setHeader("Content-Type", "text/html")
        return res.status(200).send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="0;url=${successUrl}">
            </head>
            <body>
                Redirecting...
            </body>
            </html>
        `)
    } catch (error) {
        const params = req.body as Record<string, any>;
        const successUrl = params.Details1.split(", ")[1];
        console.error("Error processing cPay push notification:", error)
        res.setHeader("Content-Type", "text/html")
        return res.status(200).send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="0;url=${successUrl}">
            </head>
            <body>
                Redirecting...
            </body>
            </html>
        `)
    }
}