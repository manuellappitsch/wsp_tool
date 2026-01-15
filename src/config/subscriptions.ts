import { SubscriptionType } from "@prisma/client";

export interface SubscriptionPlan {
    id: SubscriptionType;
    name: string;
    price: number;
    durationMonths: number;
    frequencyPerWeek: number; // 1 or 2
    hasBuildUpPhase: boolean; // If true, 2x training for first 2 months
    isGewinnspiel: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionType, SubscriptionPlan> = {
    [SubscriptionType.NORMAL_12]: {
        id: SubscriptionType.NORMAL_12,
        name: "WSP Bindung 1 Jahr (1x Woche)",
        price: 119.99,
        durationMonths: 12,
        frequencyPerWeek: 1,
        hasBuildUpPhase: false,
        isGewinnspiel: false
    },
    [SubscriptionType.NORMAL_6]: {
        id: SubscriptionType.NORMAL_6,
        name: "WSP Bindung 6 Monate (1x Woche)",
        price: 139.99,
        durationMonths: 6,
        frequencyPerWeek: 1,
        hasBuildUpPhase: false,
        isGewinnspiel: false
    },
    [SubscriptionType.NORMAL_12_BUILDUP]: {
        id: SubscriptionType.NORMAL_12_BUILDUP,
        name: "WSP Bindung 1 Jahr + Aufbau (2M 2x Woche)",
        price: 139.99,
        durationMonths: 12,
        frequencyPerWeek: 1, // Base frequency
        hasBuildUpPhase: true,
        isGewinnspiel: false
    },
    [SubscriptionType.NORMAL_6_BUILDUP]: {
        id: SubscriptionType.NORMAL_6_BUILDUP,
        name: "WSP Bindung 6 Monate + Aufbau (2M 2x Woche)",
        price: 179.99,
        durationMonths: 6,
        frequencyPerWeek: 1,
        hasBuildUpPhase: true,
        isGewinnspiel: false
    },
    [SubscriptionType.INTENSE_12]: {
        id: SubscriptionType.INTENSE_12,
        name: "WSP Intense 1 Jahr (2x Woche)",
        price: 219.99,
        durationMonths: 12,
        frequencyPerWeek: 2,
        hasBuildUpPhase: false,
        isGewinnspiel: false
    },
    [SubscriptionType.INTENSE_6]: {
        id: SubscriptionType.INTENSE_6,
        name: "WSP Intense 6 Monate (2x Woche)",
        price: 249.99,
        durationMonths: 6,
        frequencyPerWeek: 2,
        hasBuildUpPhase: false,
        isGewinnspiel: false
    },
    [SubscriptionType.WIN_12]: {
        id: SubscriptionType.WIN_12,
        name: "Gewinnspiel: 1 Jahr (1x Woche)",
        price: 84.00,
        durationMonths: 12,
        frequencyPerWeek: 1,
        hasBuildUpPhase: false,
        isGewinnspiel: true
    },
    [SubscriptionType.WIN_6]: {
        id: SubscriptionType.WIN_6,
        name: "Gewinnspiel: 6 Monate (1x Woche)",
        price: 98.00,
        durationMonths: 6,
        frequencyPerWeek: 1,
        hasBuildUpPhase: false,
        isGewinnspiel: true
    },
    [SubscriptionType.WIN_12_BUILDUP]: {
        id: SubscriptionType.WIN_12_BUILDUP,
        name: "Gewinnspiel: 1 Jahr + Aufbau (2M 2x Woche)",
        price: 98.00,
        durationMonths: 12,
        frequencyPerWeek: 1,
        hasBuildUpPhase: true,
        isGewinnspiel: true
    },
    [SubscriptionType.WIN_6_BUILDUP]: {
        id: SubscriptionType.WIN_6_BUILDUP,
        name: "Gewinnspiel: 6 Monate + Aufbau (2M 2x Woche)",
        price: 126.00,
        durationMonths: 6,
        frequencyPerWeek: 1,
        hasBuildUpPhase: true,
        isGewinnspiel: true
    }
};

export function getSubscriptionLimit(type: SubscriptionType, monthIndex: number): number {
    const plan = SUBSCRIPTION_PLANS[type];
    if (!plan) return 4; // Default fallback

    // Base slots per month (approx 4 per week)
    const baseSlots = plan.frequencyPerWeek * 4;

    // Build-up Phase Logic:
    // If hasBuildUpPhase is true AND current month is < 2 (Month 0 and 1)
    // Then double the frequency (or set to 2x week = 8 slots)
    if (plan.hasBuildUpPhase && monthIndex < 2) {
        return 8; // 2x week * 4
    }

    return baseSlots;
}
