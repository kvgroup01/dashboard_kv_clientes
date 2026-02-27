import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

import fs from "fs";

// Google Sheets Auth
const getSheetsClient = () => {
  let jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const filePath = path.join(__dirname, "src", "kv-dashoard-f9c071c27ef7.json");

  // Fallback to local file if env var is missing or invalid
  if ((!jsonString || jsonString === '{}' || jsonString.startsWith("kv-dashboard")) && fs.existsSync(filePath)) {
    console.log("Usando arquivo JSON local para autenticação.");
    jsonString = fs.readFileSync(filePath, "utf8");
  }

  if (!jsonString || jsonString === '{}') {
    throw new Error("A variável GOOGLE_SERVICE_ACCOUNT_JSON não foi configurada nos Secrets e o arquivo local não foi encontrado.");
  }

  let credentials;
  try {
    credentials = JSON.parse(jsonString);
  } catch (e: any) {
    if (jsonString.startsWith("kv-dashboard")) {
      throw new Error("Você parece ter configurado apenas o e-mail nos Secrets. Cole o conteúdo do arquivo .json");
    }
    console.error("Erro ao parsear JSON de credenciais:", e.message);
    throw new Error("O conteúdo das credenciais não é um JSON válido.");
  }

  if (!credentials || !credentials.client_email || !credentials.private_key) {
    throw new Error("As credenciais estão incompletas. Certifique-se de que o JSON contém 'client_email' e 'private_key'.");
  }

  // Ensure the private_key is properly formatted, translating encoded newlines if they exist
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

// List clients (Admin)
app.get("/api/admin/clients", async (req, res) => {
  try {
    if (!MASTER_SHEET_ID) {
      return res.status(500).json({ error: "MASTER_SHEET_ID não configurado." });
    }
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: "clientes!A2:H", // token | nome_cliente | sheets_id | ativo | aba_metricas | aba_leads | tipo_funil | slug
    });

    const rows = response.data.values || [];
    const clients = rows
      .filter((row) => row[0] && row[0].trim() !== "") // Filter out rows without a token
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
    res.status(500).json({ error: error.message });
  }
});

// Add client (Admin)
app.post("/api/admin/clients", async (req, res) => {
  try {
    if (!MASTER_SHEET_ID) {
      return res.status(500).json({ error: "MASTER_SHEET_ID não configurado." });
    }
    const { nome_cliente, sheets_id, aba_metricas, aba_leads, tipo_funil, slug } = req.body;
    const token = uuidv4();
    const sheets = getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: MASTER_SHEET_ID,
      range: "clientes!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[token, nome_cliente, sheets_id, "TRUE", aba_metricas, aba_leads, tipo_funil, slug || ""]],
      },
    });

    res.json({ success: true, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle client status (Admin)
app.patch("/api/admin/clients/:token", async (req, res) => {
  try {
    if (!MASTER_SHEET_ID) {
      return res.status(500).json({ error: "MASTER_SHEET_ID não configurado." });
    }
    const { token } = req.params;
    const { ativo } = req.body;
    const sheets = getSheetsClient();

    // Find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: "clientes!A:A",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === token) + 1;

    if (rowIndex === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: MASTER_SHEET_ID,
      range: `clientes!D${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[ativo ? "TRUE" : "FALSE"]],
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Public Report Data
app.get("/api/report/:token", async (req, res) => {
  try {
    if (!MASTER_SHEET_ID) {
      return res.status(500).json({ error: "MASTER_SHEET_ID não configurado." });
    }
    const { token } = req.params;
    const sheets = getSheetsClient();

    // 1. Get client config from Master Sheet
    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: "clientes!A2:H",
    });
    const masterRows = masterResponse.data.values || [];
    // Search by token (col A) or slug (col H)
    const client = masterRows.find((row) => row[0] === token || (row[7] && row[7] === token));

    if (!client) {
      return res.status(404).json({ error: "Token/Link inválido ou cliente não encontrado." });
    }

    const ativoValue = String(client[3] || "").toUpperCase();
    if (ativoValue !== "TRUE" && ativoValue !== "VERDADEIRO") {
      return res.status(403).json({ error: "Este relatório está desativado no painel administrativo." });
    }

    const [_, nome_cliente, sheets_id, ativo, aba_metricas, aba_leads, tipo_funil, slug] = client;

    // 2. Fetch Metrics
    const metricsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheets_id,
      range: `${aba_metricas}!A2:T`,
    });
    const metricsRows = metricsResponse.data.values || [];

    // Helpers: suporta números BR formatados ("R$ 1.234,56", "1.234,56", "1234.56", etc.)
    const toFloat = (val: any): number => {
      if (typeof val === "number") return val;
      const clean = String(val ?? "0")
        .replace(/R\$\s*/gi, "")   // remove "R$"
        .replace(/\s/g, "")        // remove espaços
        .replace(/\.(?=\d{3}[,.])/g, "") // remove ponto de milhar (1.234,56 → 1234,56)
        .replace(",", ".");        // vírgula decimal → ponto
      return parseFloat(clean) || 0;
    };
    const toInt = (val: any): number => Math.round(toFloat(val));

    // Map metrics based on the provided columns and funil type
    const metrics = metricsRows
      .filter(row => row[1]) // Ensure there's at least a date
      .map(row => {
        if (tipo_funil === "leads") {
          // Columns from prompt: id | date_start | campaign_id | ad_id | campaign_name | adset_name | ad_name | spend | impressions | reach | frequency | link_click | initiate_checkout | landing_page_view | purchase | lead | conversao_personalizada | url_anuncio | thumbnail_url | publisher_platform
          const invest = toFloat(row[7]);
          const imps = toInt(row[8]);
          const clicks = toInt(row[11]);
          return {
            chave: row[0],
            data: String(row[1] ?? ""),
            campanha: String(row[4] ?? ""),
            conjunto: String(row[5] ?? ""),
            anuncio: String(row[6] ?? ""),
            thumbnail: String(row[18] ?? ""),
            link: String(row[17] ?? ""),
            investimento: invest,
            impressoes: imps,
            alcance: toInt(row[9]),
            cliques: clicks,
            leads_meta: toInt(row[15]),
            ctr: imps > 0 ? (clicks / imps) * 100 : 0,
            cpc: clicks > 0 ? (invest / clicks) : 0,
            conversas: toInt(row[15]), // mantem para compatibilidade
            custo_conversa: toInt(row[15]) > 0 ? invest / toInt(row[15]) : 0,
            cpm: imps > 0 ? (invest / imps) * 1000 : 0,
          };
        } else {
          // Defaults for WhatsApp
          return {
            chave: row[0],
            data: String(row[1] ?? ""),
            campanha: String(row[2] ?? ""),
            conjunto: String(row[3] ?? ""),
            anuncio: String(row[4] ?? ""),
            thumbnail: String(row[5] ?? ""),
            link: String(row[6] ?? ""),
            investimento: toFloat(row[7]),
            impressoes: toInt(row[8]),
            alcance: toInt(row[9]),
            cliques: toInt(row[10]),
            cliques_saida: toInt(row[11]),
            leads_clique_saida: toInt(row[12]),
            ctr: toFloat(row[13]),
            cpc: toFloat(row[14]),
            conversas: toInt(row[15]),
            custo_conversa: toFloat(row[16]),
            cpm: toFloat(row[17]),
            leads_meta: toInt(row[15]),
          };
        }
      });

    // 3. Fetch Leads if applicable
    let leads = [];
    if (tipo_funil === "leads" && aba_leads) {
      const leadsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheets_id,
        range: `${aba_leads}!A2:K`,
      });
      const leadsRows = leadsResponse.data.values || [];
      // data | nome | email | escolaridade | telefone | utm_source | utm_campaign | utm_medium | utm_content | utm_term
      // Observação: a ordem pode estar ligeiramente diferente do banco anterior. O usuário informou: DATA | NOME | EMAIL | ESCOLARIDADE | TELEFONE | utm_source | utm_campaign | utm_medium | utm_content | utm_term
      leads = leadsRows
        .filter(row => row[0] && row[0].trim() !== "" && row[0].toLowerCase() !== "data") // Pula cabecalho e linhas vazias
        .map(row => ({
          data: String(row[0] ?? ""),
          nome: String(row[1] ?? ""),
          email: String(row[2] ?? ""),
          escolaridade: String(row[3] ?? ""),
          telefone: String(row[4] ?? ""),
          utm_source: String(row[5] ?? ""),
          utm_campaign: String(row[6] ?? ""),
          utm_medium: String(row[7] ?? ""),
          utm_content: String(row[8] ?? ""),
          utm_term: String(row[9] ?? ""),
          curso_interesse: "", // backward compatibility
        }));
    }

    res.json({
      client: { nome_cliente, tipo_funil },
      metrics,
      leads
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
