import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON parsing with a large limit for PDF/document uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for the Google Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. Please open Settings > Secrets and configure your GEMINI_API_KEY to enable specification parsing."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API endpoint to parse specification text or documents
app.post("/api/parse-spec", async (req, res) => {
  try {
    const { fileName, fileType, base64Data, textContent, customKeywords } = req.body;

    let gemini;
    try {
      gemini = getGeminiClient();
    } catch (keyError: any) {
      return res.status(401).json({
        error: "Configuration Error",
        message: keyError.message || "GEMINI_API_KEY is missing.",
      });
    }

    let result;
    const modelName = "gemini-3.5-flash";

    let userKeywordsPrompt = "";
    if (customKeywords) {
      const { training, om, warranty, asBuilt } = customKeywords;
      userKeywordsPrompt = `
      =========================================
      HIGH-PRIORITY STEERING FOR USER-DEFINED KEYWORDS:
      The project owner has customized the search requirements. You MUST scan for, prioritize matching, extracting, and reporting requirements that contain, relate to, or discuss the following project-specific terminology rules:
      
      - Owner Training (CATEGORY A) terms of interest: ${training && training.length > 0 ? training.map((k: string) => `"${k}"`).join(", ") : "None specified"}
      - O&M Manuals / Data (CATEGORY B) terms of interest: ${om && om.length > 0 ? om.map((k: string) => `"${k}"`).join(", ") : "None specified"}
      - Warranties / Guarantees (CATEGORY C) terms of interest: ${warranty && warranty.length > 0 ? warranty.map((k: string) => `"${k}"`).join(", ") : "None specified"}
      - Record Documents / As-Builts (CATEGORY D) terms of interest: ${asBuilt && asBuilt.length > 0 ? asBuilt.map((k: string) => `"${k}"`).join(", ") : "None specified"}
      
      If any line, section, or sentence inside the specification triggers or relates to these user-defined keywords, guarantee that you extract and record the item, and specifically include a note about the matched terms in its description.
      =========================================
      `;
    }

    const promptText = `
      You are an expert construction specification engineer and code reviewer.
      Analyze the attached construction specification section document or text to identify:
      1. All specific instances of Owner Training and/or Demonstration requirements.
      2. All specific instances where the contractor must submit or provide Operation manuals, maintenance manuals, maintenance data, O&M manuals, or operation and maintenance data.
      3. All specific instances where the contractor must provide, register, or submit Warranties (e.g. general contractor warranties, manufacturer warranties, special warranties, extended warranties, correction periods).
      4. All specific instances where the contractor must provide, keep, submit or maintain Record Documents, As-Built Drawings, Redline Drawings, Record Drawings or Record Specifications.

      Look closely for and differentiate:

      CATEGORY A: Owner Training / Demonstration
      Look for specifications requiring the contractor to:
      - Train the owner's personnel on equipment or systems (e.g., HVAC, electrical switchgear, plumbing, software, fire alarm, backup power).
      - Provide live demonstration, instructions, or operational guidelines for equipment.
      - Supply training materials, manuals, video recordings, or documentation of demonstration.

      CATEGORY B: Operation & Maintenance (O&M) Manuals / Data
      Look for specifications requiring the contractor to submit or supply:
      - Operation manuals
      - Maintenance manuals
      - Maintenance data
      - O&M manuals or O&M data
      - Operation and maintenance data

      CATEGORY C: Warranties / Guarantees / Correction Periods
      Look for specifications requiring the contractor to submit or supply:
      - Special warranties of products/equipment
      - Manufacturer's standard or extended warranties
      - Contractor's warranty of work or correction period guarantees
      - Service agreements or maintenance bonds related to warranty periods

      CATEGORY D: Record Documents / As-Built Drawings & Redline Drawings
      Look for specifications requiring the contractor to provide, maintain or submit:
      - As-built drawings, as-built specifications, or as-built records
      - Redline drawings, redlined prints, or construction field mockups marked with changes
      - Record drawings, record specifications, or final record submittals
      - CAD files, CAD drawings, or BIM record representations of changes-in-place

      For each identified item in CATEGORY A (Owner Training), extract:
      - csiCode: CSI spec section code in MasterFormat, e.g., '26 05 00'. Formatted nicely with spaces.
      - sectionName: The specification section name, e.g., 'Demonstration and Training'.
      - type: One of: 'Training', 'Demonstration', 'Both'.
      - description: A comprehensive description of what training or demonstration is required, including hours or deliverables if specified.
      - sourceExcerpt: Exact snippet or paragraph of the specification referencing this requirement.

      For each identified item in CATEGORY B (O&M Manuals / Data), extract:
      - csiCode: CSI spec section code in MasterFormat, e.g., '26 05 00'. Formatted nicely with spaces.
      - sectionName: The specification section name, e.g., 'Common Work Results for Electrical'.
      - type: Specify the matched document type from the spec, e.g., "O&M Manual", "Maintenance Manual", "Operation Manual", "Maintenance Data", "Operation and Maintenance Data". Use the most specific one mentioned.
      - description: A comprehensive description of the required O&M manual, maintenance dataset, submittal timeline, quantities, form of media (digital/printed), or operational instructions required.
      - sourceExcerpt: Exact snippet or paragraph of the specification referencing this O&M submittal requirement.

      For each identified item in CATEGORY C (Warranties), extract:
      - csiCode: CSI spec section code in MasterFormat, e.g., '26 05 00'. Formatted nicely with spaces.
      - sectionName: The specification section name, e.g., 'Common Work Results for Electrical'.
      - type: Specify the matched warranty type from the spec, e.g., "Special Warranty", "Extended Warranty", "Manufacturer Warranty", "Contractor Warranty", "Contractor Correction Period". Use the most specific one mentioned.
      - duration: The duration specified for the warranty (e.g. "5 years", "2 years", "Lifetime", etc.). If not specified, use "Not Specified".
      - description: A comprehensive description of what is covered under the warranty, any exclusions, start triggers (e.g., "Substantial Completion"), or repair completion timeline demands.
      - sourceExcerpt: Exact snippet or paragraph of the specification referencing this warranty or guarantee requirement.

      For each identified item in CATEGORY D (As-Built Requirements), extract:
      - csiCode: CSI spec section code in MasterFormat, e.g., '26 05 00'. Formatted nicely with spaces.
      - sectionName: The specification section name, e.g., 'Common Work Results for Electrical'.
      - type: Specify the matched record document type, e.g., 'As-Built Drawings', 'Redline Drawings', 'Record Drawings', 'Record Specifications'. Use the most specific one mentioned.
      - description: A comprehensive description of what is required for keeping redline markups during construction, compiling record drawings, submitting final CAD/BIM models, or record keeping requirements.
      - sourceExcerpt: Exact snippet or paragraph of the specification referencing this record/asbuilt drawing requirement.

      If any category has no matches, return an empty array for that property.
    `;

    // Process either textContent or file upload (base64)
    if (textContent) {
      // User entered text directly
      result = await gemini.models.generateContent({
        model: modelName,
        contents: [
          {
            text: `Specification Section Source Document text:\n\n${textContent}\n\n${userKeywordsPrompt}\n\n${promptText}`,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requirements: {
                type: Type.ARRAY,
                description: "List of training or demonstration requirements (CATEGORY A) extracted from the text",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    csiCode: {
                      type: Type.STRING,
                      description: "CSI spec section code, e.g., '26 05 00'.",
                    },
                    sectionName: {
                      type: Type.STRING,
                      description: "The specification section name, e.g., 'Demonstration and Training'.",
                    },
                    type: {
                      type: Type.STRING,
                      description: "One of: 'Training', 'Demonstration', 'Both'.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description of the training, hours, topics covered, and trainer requirements.",
                    },
                    sourceExcerpt: {
                      type: Type.STRING,
                      description: "Source paragraph quote for verification audits.",
                    },
                  },
                  required: ["csiCode", "sectionName", "type", "description", "sourceExcerpt"],
                },
              },
              omRequirements: {
                type: Type.ARRAY,
                description: "List of O&M manuals or maintenance data requirements (CATEGORY B) extracted from the text",
                items: {
                   type: Type.OBJECT,
                   properties: {
                     csiCode: {
                       type: Type.STRING,
                       description: "CSI spec section code, e.g., '26 05 00'.",
                     },
                     sectionName: {
                       type: Type.STRING,
                       description: "The specification section name, e.g., 'Direct Digital Control'.",
                     },
                     type: {
                       type: Type.STRING,
                       description: "What O&M item is required: 'O&M Manual', 'Maintenance Manual', 'Operation Manual', 'Maintenance Data', 'Operation and Maintenance Data'.",
                     },
                     description: {
                       type: Type.STRING,
                       description: "Description of what is required in the manuals (drawings, parts, schedules), digital/print copies, submittal timeline.",
                     },
                     sourceExcerpt: {
                       type: Type.STRING,
                       description: "Source paragraph quote for O&M verification audits.",
                     },
                   },
                   required: ["csiCode", "sectionName", "type", "description", "sourceExcerpt"],
                },
              },
              warrantyRequirements: {
                type: Type.ARRAY,
                description: "List of warranties or guarantees (CATEGORY C) extracted from the text",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    csiCode: {
                      type: Type.STRING,
                      description: "CSI spec section code, e.g., '26 05 00'.",
                    },
                    sectionName: {
                      type: Type.STRING,
                      description: "The specification section name, e.g., 'Common Work Results for Electrical'.",
                    },
                    type: {
                      type: Type.STRING,
                      description: "What warranty or service guarantee is required: 'Special Warranty', 'Extended Warranty', 'Manufacturer Warranty', 'Contractor Warranty', 'Contractor Correction Period'.",
                    },
                    duration: {
                      type: Type.STRING,
                      description: "Specified term or duration of the warranty, e.g., '2 years', '5 years', 'Lifetime'.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description of what is covered, exclusions, conditions, or start triggers.",
                    },
                    sourceExcerpt: {
                      type: Type.STRING,
                      description: "Source paragraph quote for warranty verification audits.",
                    },
                  },
                  required: ["csiCode", "sectionName", "type", "duration", "description", "sourceExcerpt"],
                },
              },
              asBuiltRequirements: {
                type: Type.ARRAY,
                description: "List of Record / As-Built Documents & Redline drawings requirement (CATEGORY D) extracted from the text",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    csiCode: {
                      type: Type.STRING,
                      description: "CSI spec section code, e.g., '26 05 00'.",
                    },
                    sectionName: {
                      type: Type.STRING,
                      description: "The specification section name, e.g., 'Common Work Results for Electrical'.",
                    },
                    type: {
                      type: Type.STRING,
                      description: "What record document is required: 'As-Built Drawings', 'Redline Drawings', 'Record Drawings', 'Record Specifications'.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description of record keeping rules, markup protocols, final submitted format (CAD, BIM, hardcopy, PDF), etc.",
                    },
                    sourceExcerpt: {
                      type: Type.STRING,
                      description: "Source paragraph quote for record / as-built document verification.",
                    },
                  },
                  required: ["csiCode", "sectionName", "type", "description", "sourceExcerpt"],
                },
              },
            },
            required: ["requirements", "omRequirements", "warrantyRequirements", "asBuiltRequirements"],
          },
        },
      });
    } else if (base64Data) {
      // Strips generic base64 header like "data:application/pdf;base64," if present
      const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, "");

      // Determine proper MIME for Gemini API
      let mimeType = fileType || "application/pdf";
      if (fileName && fileName.endsWith(".txt")) {
        mimeType = "text/plain";
      }

      result = await gemini.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Clean,
            },
          },
          {
            text: `${userKeywordsPrompt}\n\n${promptText}`,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requirements: {
                type: Type.ARRAY,
                description: "List of training or demonstration requirements (CATEGORY A) extracted from the document",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    csiCode: {
                      type: Type.STRING,
                      description: "CSI spec section code, e.g., '26 05 00'.",
                    },
                    sectionName: {
                      type: Type.STRING,
                      description: "The specification section name, e.g., 'Demonstration and Training'.",
                    },
                    type: {
                      type: Type.STRING,
                      description: "One of: 'Training', 'Demonstration', 'Both'.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description of the training, hours, topics covered, and trainer requirements.",
                    },
                    sourceExcerpt: {
                      type: Type.STRING,
                      description: "Source paragraph quote for verification audits.",
                    },
                  },
                  required: ["csiCode", "sectionName", "type", "description", "sourceExcerpt"],
                },
              },
              omRequirements: {
                type: Type.ARRAY,
                description: "List of O&M manuals or maintenance data requirements (CATEGORY B) extracted from the document",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    csiCode: {
                      type: Type.STRING,
                      description: "CSI spec section code, e.g., '26 05 00'.",
                    },
                    sectionName: {
                      type: Type.STRING,
                      description: "The specification section name, e.g., 'Direct Digital Control'.",
                    },
                    type: {
                      type: Type.STRING,
                      description: "What O&M item is required: 'O&M Manual', 'Maintenance Manual', 'Operation Manual', 'Maintenance Data', 'Operation and Maintenance Data'.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description of what is required in the manuals (drawings, parts, schedules), digital/print copies, submittal timeline.",
                    },
                    sourceExcerpt: {
                      type: Type.STRING,
                      description: "Source paragraph quote for O&M verification audits.",
                    },
                  },
                  required: ["csiCode", "sectionName", "type", "description", "sourceExcerpt"],
                },
              },
              warrantyRequirements: {
                type: Type.ARRAY,
                description: "List of warranties or guarantees (CATEGORY C) extracted from the document",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    csiCode: {
                      type: Type.STRING,
                      description: "CSI spec section code, e.g., '26 05 00'.",
                    },
                    sectionName: {
                      type: Type.STRING,
                      description: "The specification section name, e.g., 'Common Work Results for Electrical'.",
                    },
                    type: {
                      type: Type.STRING,
                      description: "What warranty or service guarantee is required: 'Special Warranty', 'Extended Warranty', 'Manufacturer Warranty', 'Contractor Warranty', 'Contractor Correction Period'.",
                    },
                    duration: {
                      type: Type.STRING,
                      description: "Specified term or duration of the warranty, e.g., '2 years', '5 years', 'Lifetime'.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description of what is covered, exclusions, conditions, or start triggers.",
                    },
                    sourceExcerpt: {
                      type: Type.STRING,
                      description: "Source paragraph quote for warranty verification audits.",
                    },
                  },
                  required: ["csiCode", "sectionName", "type", "duration", "description", "sourceExcerpt"],
                },
              },
              asBuiltRequirements: {
                type: Type.ARRAY,
                description: "List of Record / As-Built Documents & Redline drawings requirement (CATEGORY D) extracted from the document",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    csiCode: {
                      type: Type.STRING,
                      description: "CSI spec section code, e.g., '26 05 00'.",
                    },
                    sectionName: {
                      type: Type.STRING,
                      description: "The specification section name, e.g., 'Common Work Results for Electrical'.",
                    },
                    type: {
                      type: Type.STRING,
                      description: "What record document is required: 'As-Built Drawings', 'Redline Drawings', 'Record Drawings', 'Record Specifications'.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description of record keeping rules, markup protocols, final submitted format (CAD, BIM, hardcopy, PDF), etc.",
                    },
                    sourceExcerpt: {
                      type: Type.STRING,
                      description: "Source paragraph quote for record / as-built document verification.",
                    },
                  },
                  required: ["csiCode", "sectionName", "type", "description", "sourceExcerpt"],
                },
              },
            },
            required: ["requirements", "omRequirements", "warrantyRequirements", "asBuiltRequirements"],
          },
        },
      });
    } else {
      return res.status(400).json({ error: "Empty request. Please provide base64Data or textContent." });
    }

    const responseText = result.text;
    if (!responseText) {
      return res.json({ requirements: [] });
    }

    const parsed = JSON.parse(responseText.trim());
    return res.json(parsed);
  } catch (err: any) {
    console.error("Error processing spec document:", err);
    return res.status(500).json({
      error: "Processing Error",
      message: err.message || "An unexpected error occurred while parsing the construction specification.",
    });
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware added.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
  });
}

startServer();
