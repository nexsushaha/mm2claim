// pages/api/validate-order.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type ValidationResponse = {
  valid: boolean
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res
      .status(405)
      .json({ valid: false, message: `Method ${req.method} Not Allowed` })
  }

  const { orderNumber, email } = req.body as {
    orderNumber?: string
    email?: string
  }
  console.log('🔍 validate-order body:', { orderNumber, email })

  if (!orderNumber || !email) {
    return res
      .status(400)
      .json({ valid: false, message: 'orderNumber and email are required.' })
  }

  try {
    // ensure the "name" query matches Shopify's order name (#1234)
    const nameParam = orderNumber.startsWith('#')
      ? orderNumber
      : `#${orderNumber}`
    const shopUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/orders.json?name=${encodeURIComponent(
      nameParam
    )}`
    console.log('➡️ Fetching Shopify URL:', shopUrl)

    const shopRes = await fetch(shopUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
      },
    })
    const text = await shopRes.text()
    console.log('⬅️ Shopify raw response:', shopRes.status, text)

    if (!shopRes.ok) {
      return res
        .status(500)
        .json({ valid: false, message: 'Shopify lookup failed.' })
    }

    const { orders } = JSON.parse(text) as { orders: any[] }
    if (!orders || orders.length === 0) {
      return res
        .status(200)
        .json({ valid: false, message: 'Order does not exist.' })
    }

    const order = orders[0]
    console.log(
      '✅ Found order:',
      order.id,
      'financial_status:',
      order.financial_status,
      'fulfillment_status:',
      order.fulfillment_status,
      'email:',
      order.email
    )

    if (order.financial_status !== 'paid') {
      return res
        .status(200)
        .json({ valid: false, message: 'Order not paid yet.' })
    }
    if (order.fulfillment_status === 'fulfilled') {
      return res
        .status(200)
        .json({ valid: false, message: 'Order already fulfilled.' })
    }
    if (order.email.toLowerCase() !== email.toLowerCase()) {
      return res
        .status(200)
        .json({ valid: false, message: 'Email does not match this order.' })
    }

    return res.status(200).json({ valid: true })
  } catch (err: any) {
    console.error('❌ validate-order error:', err)
    return res
      .status(500)
      .json({ valid: false, message: 'Internal server error.' })
  }
}
