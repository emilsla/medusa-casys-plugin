import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils"
import {
    ProviderWebhookPayload,
    WebhookActionResult,
    AuthorizePaymentInput,
    AuthorizePaymentOutput,
    CapturePaymentInput,
    CapturePaymentOutput,
    CancelPaymentInput,
    CancelPaymentOutput,
    InitiatePaymentInput,
    InitiatePaymentOutput,
    DeletePaymentInput,
    DeletePaymentOutput,
    GetPaymentStatusInput,
    GetPaymentStatusOutput,
    RefundPaymentInput,
    RefundPaymentOutput,
    RetrievePaymentInput,
    RetrievePaymentOutput,
    UpdatePaymentInput,
    UpdatePaymentOutput,
} from "@medusajs/framework/types"


type Options = {
    merchantName: string
    merchantId: string
    checkSumKey: string
    paymentOkUrl: string
    paymentFailUrl: string
    backendUrl: string
}

class CasysPaymentProviderService extends AbstractPaymentProvider<Options> {

    static identifier = "casys_payment_provider";
    casysUrl = "https://gateway.bankart.si";
    protected client: any;
    protected paymentSessionService: any;
    protected orderService: any;


    protected options_: Options;

    constructor(container, options: Options) {
        super(container, options);

        this.options_ = options || {};

        this.paymentSessionService = container.paymentSessionService;
        this.client = {
            init: async (amount, currency_code, customerDetails, sessionId) => {
                return {
                    id: sessionId
                }
            },
            update: async (externalId, data) => {
            }
        };
    }

    private cartData: Record<string, unknown> | null = null;

    async capturePayment(
        input: CapturePaymentInput
    ): Promise<CapturePaymentOutput> {
        return {
            data: {
                status: "captured",
                captured_at: new Date().toISOString(),
            }
        }
    }


    async authorizePayment(
        input: AuthorizePaymentInput
    ): Promise<AuthorizePaymentOutput> {
        if (!input.data) {
            throw new Error("No input data");
        }

        const sess = await this.paymentSessionService.retrieve(input.data['id'])


        let mkdAmount: number;
        const conversionRates = {
            "eur": 61.5,
            "usd": 56,
            "gbp": 72,
            "aed": 15.5
        };

        if (sess.context.cart.currency_code as any in conversionRates) {
            mkdAmount = sess.context.cart.total as any * conversionRates[sess.context.cart.currency_code];
        } else {
            mkdAmount = sess.context.cart.total;
        }

        const body = {
            AmountToPay: mkdAmount.toFixed(0),
            AmountCurrency: "MKD",
            Details1: `Order Payment, ${this.options_.paymentOkUrl}, ${this.options_.paymentFailUrl}`,
            Details2: sess.context.cart.id,
            PayToMerchant: this.options_.merchantId,
            MerchantName: this.options_.merchantName,
            PaymentOKURL: `${this.options_.backendUrl}/api/casys/success`,
            PaymentFailURL: `${this.options_.backendUrl}/api/casys/fail`,
            FirstName: sess.context.cart.billing_address.first_name || "",
            LastName: sess.context.cart.billing_address.last_name || "",
            Address: sess.context.cart.billing_address.address_1 || "",
            City: sess.context.cart.billing_address.city || "",
            Zip: sess.context.cart.billing_address.postal_code || "",
            Country: sess.context.cart.billing_address.country_code || "",
            Email: sess.context.cart.customer.email || "",
        };

        const params = [
            { name: 'PaymentOKURL', value: body.PaymentOKURL },
            { name: 'PaymentFailURL', value: body.PaymentFailURL },
            { name: 'AmountToPay', value: body.AmountToPay },
            { name: 'AmountCurrency', value: body.AmountCurrency },
            { name: 'PayToMerchant', value: body.PayToMerchant },
            { name: 'Details1', value: body.Details1 },
            { name: 'Details2', value: body.Details2 },
            { name: 'MerchantName', value: body.MerchantName },
            { name: 'FirstName', value: body.FirstName },
            { name: 'LastName', value: body.LastName },
            { name: 'Email', value: body.Email },
            { name: 'Zip', value: body.Zip },
            { name: 'Address', value: body.Address },
            { name: 'City', value: body.City },
            { name: 'Country', value: body.Country },
        ]

        const lengths = params.map(p => p.value.length.toString().padStart(3, '0')).join("");

        const header = `${params.length.toString().padStart(2, '0')}${params.map(p => p.name).join(",")},${lengths}`;

        const inputString = [
            header,
            ...params.map(p => p.value),
            process.env.CPAY_CHECKSUM_KEY,
        ].join("");

        const crypto = require("crypto");
        const checksum = crypto.createHash("md5").update(inputString, "utf8").digest("hex");

        await this.paymentSessionService.update({
            id: input.data['id'],
            data: {
                header,
                body,
                checksum
            }
        })

        return {
            status: "authorized",
            data: {
                header,
                body,
                checksum
            }
        };
    }

    async cancelPayment(
        input: CancelPaymentInput
    ): Promise<CancelPaymentOutput> {
        return {
            data: {
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
            }
        }
    }

    async initiatePayment(
        input: InitiatePaymentInput
    ): Promise<InitiatePaymentOutput> {
        const {
            amount,
            currency_code,
            context: customerDetails
        } = input

        try {
            const response = await this.client.init(
                amount,
                currency_code,
                customerDetails
            )

            this.cartData = customerDetails ?? null

            return {
                id: response.id,
                data: {
                    id: response.id,
                    status: "pending"
                }
            }
        } catch (e) {
            throw new Error(`Failed to initiate payment: ${e.message}`)
        }
    }

    async deletePayment(
        input: DeletePaymentInput
    ): Promise<DeletePaymentOutput> {
        return {}
    }

    async getPaymentStatus(
        input: GetPaymentStatusInput
    ): Promise<GetPaymentStatusOutput> {
        return {
            status: "authorized"
        }
    }

    async refundPayment(
        input: RefundPaymentInput
    ): Promise<RefundPaymentOutput> {
        throw new Error("Method not implemented.")
    }

    async retrievePayment(
        input: RetrievePaymentInput
    ): Promise<RetrievePaymentOutput> {
        throw new Error("Method not implemented.")
    }

    async updatePayment(
        input: UpdatePaymentInput
    ): Promise<UpdatePaymentOutput> {
        const { amount, currency_code, context } = input
        const externalId = input.data?.id

        if (!context) { throw new Error("Context undefined.") }


        try {
            const response = await this.client.update(
                externalId,
                {
                    amount,
                    currency_code,
                    customer: context.customer
                }
            )

            return {
                data: {
                    id: response.id,
                    status: "updated"
                }
            }
        } catch (e) {
            throw new Error(`Failed to update payment: ${e.message}`)
        }
    }

    async getWebhookActionAndData(
        payload: ProviderWebhookPayload["payload"]
    ): Promise<WebhookActionResult> {
        const {
            data,
            rawData,
            headers
        } = payload
        throw new Error("Method not implemented.")
    }


}

export default CasysPaymentProviderService