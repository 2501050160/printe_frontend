export const blockThemes = {
    "C Block": {
        accent: "#22d3ee",
        accentSoft: "rgba(34, 211, 238, 0.18)",
        glow: "#0891b2",
        label: "C Block Print Studio",
        background:
            "radial-gradient(circle at 15% 20%, rgba(34,211,238,0.35), transparent 28rem), radial-gradient(circle at 85% 10%, rgba(251,191,36,0.22), transparent 24rem), linear-gradient(135deg, #04111f 0%, #0c2d48 45%, #10243e 100%)",
        slides: [
            {
                title: "Welcome to C Block",
                text: "Upload from your phone, pay online, and collect your prints right here at the C Block counter."
            },
            {
                title: "Fast Campus Printing",
                text: "Your order number will appear on this screen when printing starts."
            },
            {
                title: "Need Help?",
                text: "Keep your order ID ready. Collection alerts appear automatically after printing."
            }
        ]
    },
    "R Block": {
        accent: "#4ade80",
        accentSoft: "rgba(74, 222, 128, 0.18)",
        glow: "#16a34a",
        label: "R Block Print Lounge",
        background:
            "radial-gradient(circle at 20% 15%, rgba(74,222,128,0.32), transparent 30rem), radial-gradient(circle at 80% 80%, rgba(45,212,191,0.18), transparent 26rem), linear-gradient(135deg, #03140d 0%, #0f2f22 48%, #112018 100%)",
        slides: [
            {
                title: "Welcome to R Block",
                text: "Smart cloud printing for R Block — upload, pay, and pick up without waiting in line."
            },
            {
                title: "Live Queue Display",
                text: "Watch your order move from waiting to printing to ready for collection."
            },
            {
                title: "Eco-Friendly Printing",
                text: "Select only the pages you need and choose black & white to save pages."
            }
        ]
    },
    "L Block": {
        accent: "#c084fc",
        accentSoft: "rgba(192, 132, 252, 0.2)",
        glow: "#9333ea",
        label: "L Block Print Hub",
        background:
            "radial-gradient(circle at 12% 18%, rgba(192,132,252,0.34), transparent 28rem), radial-gradient(circle at 88% 72%, rgba(244,114,182,0.18), transparent 24rem), linear-gradient(135deg, #12061f 0%, #2a1145 50%, #1a1030 100%)",
        slides: [
            {
                title: "Welcome to L Block",
                text: "Library-grade cloud printing with secure payments and real-time order tracking."
            },
            {
                title: "Study Smart",
                text: "Send notes from anywhere and collect finished prints at the L Block desk."
            },
            {
                title: "Order Updates Here",
                text: "This screen shows the active queue and tells you when your pages are ready."
            }
        ]
    },
    "Library": {
        accent: "#fbbf24",
        accentSoft: "rgba(251, 191, 36, 0.2)",
        glow: "#d97706",
        label: "Library Print Zone",
        background:
            "radial-gradient(circle at 18% 20%, rgba(251,191,36,0.28), transparent 28rem), radial-gradient(circle at 82% 75%, rgba(245,158,11,0.16), transparent 24rem), linear-gradient(135deg, #1a1208 0%, #3d2a0a 50%, #241808 100%)",
        slides: [
            {
                title: "Welcome to the Library",
                text: "Quiet, quick printing — upload from your device and collect at the library desk."
            },
            {
                title: "Study & Print",
                text: "Perfect for notes, assignments, and research papers."
            },
            {
                title: "Live Order Board",
                text: "Your order number appears here when your document is ready."
            }
        ]
    },
    "D Block": {
        accent: "#34d399",
        accentSoft: "rgba(52, 211, 153, 0.18)",
        glow: "#059669",
        label: "D Block Print Desk",
        background:
            "radial-gradient(circle at 14% 18%, rgba(52,211,153,0.3), transparent 28rem), linear-gradient(135deg, #041510 0%, #0d2b20 50%, #102018 100%)",
        slides: [
            {
                title: "Welcome to D Block",
                text: "Engineering wing cloud printing — fast, automated, and cashless."
            },
            {
                title: "Upload & Go",
                text: "Pay from your phone and pick up at the D Block counter."
            },
            {
                title: "Queue Display",
                text: "Watch live status updates on this screen."
            }
        ]
    },
    "E Block": {
        accent: "#a78bfa",
        accentSoft: "rgba(167, 139, 250, 0.2)",
        glow: "#7c3aed",
        label: "E Block Print Lab",
        background:
            "radial-gradient(circle at 16% 16%, rgba(167,139,250,0.32), transparent 28rem), linear-gradient(135deg, #120a24 0%, #2e1f5e 50%, #1a1038 100%)",
        slides: [
            {
                title: "Welcome to E Block",
                text: "Science block printing with real-time order tracking."
            },
            {
                title: "Smart Printing",
                text: "Choose pages, copies, and color — pay online in seconds."
            },
            {
                title: "Collection Alert",
                text: "We notify you here when your print is ready."
            }
        ]
    }
};

export const defaultTheme = blockThemes["C Block"];

export function getBlockTheme(block) {
    return blockThemes[block] || defaultTheme;
}
