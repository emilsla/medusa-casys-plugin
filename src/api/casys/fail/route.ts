import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"


export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    try {
        const params = req.body as Record<string, any>

        let failUrl = params.Details1.split(", ")[2];

        res.setHeader("Content-Type", "text/html")
        return res.status(200).send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="0;url=${failUrl}">
            </head>
            <body>
                Redirecting...
            </body>
            </html>
        `)
    } catch (error) {
        const params = req.body as Record<string, any>;
        let failUrl = params.Details1.split(", ")[2];
        console.error("Error processing cPay push notification:", error)
        res.setHeader("Content-Type", "text/html")
        return res.status(200).send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="0;url=${failUrl}">
            </head>
            <body>
                Redirecting...
            </body>
            </html>
        `)
    }
}