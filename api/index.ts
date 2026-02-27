import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Google Sheets Auth
const getSheetsClient = () => {
    let jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!jsonString || jsonString === '{}') {
        throw new Error("A variável GOOGLE_SERVICE_ACCOUNT_JSON não foi configurada.");
    }

    let credentials;
    try {
        credentials = JSON.parse(jsonString);
    } catch (e) {
        throw new Error("O conteúdo das credenciais não é um JSON válido.");
    }

    if (!credentials || !credentials.client_email || !credentials.private_key) {
        throw new Error("As credenciais estão incompletas.");
    }

    const privateKey = credentials.private_key.split(String.raw`\n`).join('\n');

    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
};

const MASTER_SHEET_ID = process.env.MASTER_SHEET_ID;

// API Routes
app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Invalid password" });
    }
});

app.get("/api/admin/clients", async (req, res) => {
    try {
        if (!MASTER_SHEET_ID) {
            return res.status(500).json({ error: "MASTER_SHEET_ID não configurado." });
        }
        const sheets = getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: MASTER_SHEET_ID,
            range: "clientes!A2:H",
        });

        const rows = response.data.values || [];
        const clients = rows
            .filter((row) => row[0] && row[0].trim() !== "")
            .map((row) => {
                const ativoValue = String(row[3] || "").toUpperCase();
                return {
                    token: row[0],
                    nome_cliente: row[1] || "Sem Nome",
                    sheets_id: row[2] || "",
                    ativo: ativoValue === "TRUE" || ativoValue === "VERDADEIRO",
                    aba_metricas: row[4] || "Métricas",
                    aba_leads: row[5] || "",
                    tipo_funil: row[6] || "whatsapp",
                    slug: row[7] || "",
                };
            });

        res.json(clients);
    } catch (error: any) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: "Failed to fetch clients", details: error.message });
    }
});

app.get("/api/client/data", async (req, res) => {
    try {
        const { token, slug } = req.query;
        if (!token && !slug) {
            return res.status(400).json({ error: "Token ou Slug numérico é obrigatório" });
        }
        if (!MASTER_SHEET_ID) {
            return res.status(500).json({ error: "MASTER_SHEET_ID não configurado" });
        }

        const sheets = getSheetsClient();
        const masterResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: MASTER_SHEET_ID,
            range: "clientes!A2:H",
        });

        const rows = masterResponse.data.values || [];
        let clientRow = null;
        if (slug) {
            clientRow = rows.find((r) => r[7] === slug && (String(r[3] || "").toUpperCase() === "TRUE" || String(r[3] || "").toUpperCase() === "VERDADEIRO"));
        }
        if (!clientRow && token) {
            clientRow = rows.find((r) => r[0] === token && (String(r[3] || "").toUpperCase() === "TRUE" || String(r[3] || "").toUpperCase() === "VERDADEIRO"));
        }

        if (!clientRow) {
            return res.status(404).json({ error: "Dashboard não encontrado ou inativo." });
        }

        const client = {
            token: clientRow[0],
            nome_cliente: clientRow[1],
            sheets_id: clientRow[2],
            ativo: true,
            aba_metricas: clientRow[4] || "Métricas",
            aba_leads: clientRow[5] || "",
            tipo_funil: clientRow[6] || "whatsapp",
        };

        const clientSheetId = client.sheets_id;
        const aba_metricas = client.aba_metricas;
        const aba_leads = client.aba_leads;
        const tipo_funil = client.tipo_funil;

        // Default metrics mapping mechanism exactly like server.ts
        const metricResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: clientSheetId,
            range: `${aba_metricas}!A2:T`,
        });

        const metricRows = metricResponse.data.values || [];
        const metrics = metricRows.filter(row => row[0] && row[0].trim() !== "").map(row => {
            if (tipo_funil === "leads") {
                return {
                    data: row[1],
                    campanha: row[4],
                    conjunto: row[5],
                    anuncio: row[6],
                    investimento: parseFloat(row[7]?.replace("R$", "").replace(/\./g, "").replace(",", ".") || "0"),
                    impressoes: parseInt(row[8] || "0", 10),
                    alcance: parseInt(row[9] || "0", 10),
                    cliques: parseInt(row[11] || "0", 10),
                    leads_meta: parseInt(row[15] || "0", 10), // leads column
                    link: row[17] || "",
                    thumbnail: row[18] || ""
                };
            } else {
                return {
                    data: row[1],
                    campanha: row[4],
                    conjunto: row[5],
                    anuncio: row[6],
                    investimento: parseFloat(row[7]?.replace("R$", "").replace(/\./g, "").replace(",", ".") || "0"),
                    impressoes: parseInt(row[8] || "0", 10),
                    alcance: parseInt(row[9] || "0", 10),
                    cliques: parseInt(row[11] || "0", 10),
                    conversas: parseInt(row[17] || "0", 10), // whatsapp conversations
                    leads_clique_saida: parseInt(row[18] || "0", 10), // deprecated link click/leads
                    link: row[20] || "",
                    thumbnail: row[21] || ""
                };
            }
        });

        let leads: any[] = [];
        if (aba_leads) {
            try {
                const fetchLeads = await sheets.spreadsheets.values.get({
                    spreadsheetId: clientSheetId,
                    range: `${aba_leads}!A2:K`,
                });
                const leadsRows = fetchLeads.data.values || [];
                leads = leadsRows.filter(row => row && row[0] && row[0].trim() !== "").map(row => ({
                    data: row[0] || "",
                    nome: row[1] || "",
                    email: row[2] || "",
                    escolaridade: row[3] || "",
                    telefone: row[4] || "",
                    utm_source: row[5] || "",
                    utm_campaign: row[6] || "",
                    utm_medium: row[7] || "",
                    utm_content: row[8] || "",
                    utm_term: row[9] || ""
                }));
            } catch (err) {
                console.warn(`Could not read leads for client ${client.nome_cliente}`);
            }
        }

        res.json({ client, metrics, leads });
    } catch (error: any) {
        console.error("Error fetching client data:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data", details: error.message });
    }
});

// Export Express app to become a Vercel Serverless Function
export default app;
