import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils"
import {
    CreatePaymentProviderSession,
    PaymentProviderError,
    PaymentProviderSessionResponse,
    ProviderWebhookPayload,
    UpdatePaymentProviderSession,
    WebhookActionResult,
} from "@medusajs/framework/types"

import { MedusaContainer } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"


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

    capturePayment(paymentData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        return Promise.resolve({
            status: "captured",
            captured_at: new Date().toISOString()
        })
    }


    async authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<PaymentProviderError | { status: PaymentSessionStatus; data: PaymentProviderSessionResponse["data"] }> {

        const sess = await this.paymentSessionService.retrieve(paymentSessionData['id'])

        let mkdAmount: number | null = null;
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
            AmountToPay: mkdAmount!.toFixed(0),
            AmountCurrency: "MKD",
            Details1: `Order Payment, ${this.options_.paymentOkUrl}, ${this.options_.paymentFailUrl}`,
            Details2: context.cart_id,
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
            id: paymentSessionData['id'], data: {
                header,
                body,
                checksum
            }
        })

        return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: {
                header,
                body,
                checksum
            }
        };
    }

    cancelPayment(paymentData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.")
    }
    deletePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        return Promise.resolve({
            status: "deleted",
            deleted_at: new Date().toISOString(),
        })
    }
    getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
        throw new Error("Method not implemented.")
    }
    refundPayment(paymentData: Record<string, unknown>, refundAmount: number): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.")
    }
    retrievePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.")
    }
    getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
        throw new Error("Method not implemented.")
    }

    async initiatePayment(
        input: CreatePaymentProviderSession
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {

        const { email, extra, session_id, customer } = input.context
        const { currency_code, amount } = input;

        this.cartData = input.context


        try {
            const response = await this.client.init(
                amount, currency_code, customer
            )


            return {
                ...response,
                data: {
                    id: session_id
                }
            }
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async updatePayment(
        context: UpdatePaymentProviderSession
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        const {
            amount,
            currency_code,
            context: customerDetails,
            data
        } = context
        const externalId = data.id

        try {
            const response = await this.client.update(
                externalId,
                {
                    amount,
                    currency_code,
                    customerDetails
                }
            )

            return {
                ...response,
                data: {
                    id: response.id
                }
            }
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }


}

export default CasysPaymentProviderService