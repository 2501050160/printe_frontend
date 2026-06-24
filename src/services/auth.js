import api from "./api";

export async function loginUser(email, password) {
    const response = await api.post("/login", {
        email,
        password
    });

    return response.data;
}

export async function registerUser(user) {
    const response = await api.post("/register", user);

    return response.data;
}

export function persistUser(user) {
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userEmail", user.email);

    if (user.walletBalance != null) {
        localStorage.setItem(
            "walletBalance",
            String(user.walletBalance)
        );
    }
}

export function clearUserSession() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("walletBalance");
    localStorage.removeItem("selectedBlock");
    localStorage.removeItem("order");
}

export async function getWalletBalance(userId) {
    const response = await api.get("/wallet/balance", {
        params: { userId }
    });

    localStorage.setItem(
        "walletBalance",
        String(response.data)
    );

    return response.data;
}

export function getStoredWalletBalance() {
    const value = localStorage.getItem("walletBalance");

    return value ? Number(value) : 0;
}
