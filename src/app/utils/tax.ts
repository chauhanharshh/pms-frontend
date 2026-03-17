export interface TaxBreakdown {
    rate: number;
    amount: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
}

/**
 * Calculates GST based on Indian Hotel GST rules:
 * - ₹0 to ₹7500: 5%
 * - Above ₹7500: 18%
 * 
 * @param dailyRent The rent per day for one room
 * @param nights Number of nights stayed
 * @returns Tax breakdown
 */
export function calculateRoomTax(dailyRent: number, nights: number = 1): TaxBreakdown {
    const rent = dailyRent;
    const numNights = nights;

    let rate = 5;
    if (rent > 7500) {
        rate = 18;
    }

    const cgstRate = rate / 2;
    const sgstRate = rate / 2;

    const totalRoomCharges = rent * numNights;

    const cgstAmount = Math.round((totalRoomCharges * cgstRate) / 100);
    const sgstAmount = Math.round((totalRoomCharges * sgstRate) / 100);
    const amount = cgstAmount + sgstAmount;

    return {
        rate,
        amount,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
    };
}
