import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey ?? "");

/**
 * All interviewer logic (questions, nudges, evaluation) runs on this model.
 * Kept as a single named export so swapping models later is a one-line change.
 */
export const INTERVIEWER_MODEL = "gemini-3.6-flash";

/**
 * Central place to pick a model for a given call site. Currently every
 * caller uses the same model, but keeping this indirection means Phase 2+
 * services (interviewer.ts, evaluator.ts) never hardcode a model string.
 */
export function routeModel(_purpose: "interview" | "evaluation"): string {
  return INTERVIEWER_MODEL;
}

// ---------------------------------------------------------------------------
// Anthropic-shaped adapter around the Gemini SDK.
//
// interviewer.ts / evaluator.ts were written against `anthropic.messages
// .create(...)`; this adapter keeps that call shape so those files don't
// need to know which model provider is behind it.
// ---------------------------------------------------------------------------

type JsonSchema = {
  type?: "object" | "string" | "number" | "integer" | "boolean" | "array" | "null";
  description?: string;
  enum?: string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
};

const TYPE_MAP: Record<string, SchemaType> = {
  object: SchemaType.OBJECT,
  string: SchemaType.STRING,
  number: SchemaType.NUMBER,
  integer: SchemaType.INTEGER,
  boolean: SchemaType.BOOLEAN,
  array: SchemaType.ARRAY,
};

/** Converts the subset of JSON Schema used in this codebase to Gemini's Schema format. */
function toGeminiSchema(schema: JsonSchema): Schema {
  if (schema.anyOf) {
    const nonNull = schema.anyOf.find((s) => s.type !== "null");
    const hasNull = schema.anyOf.some((s) => s.type === "null");
    const converted = toGeminiSchema(nonNull ?? { type: "string" });
    return { ...converted, nullable: hasNull } as Schema;
  }

  const type = TYPE_MAP[schema.type ?? "string"] ?? SchemaType.STRING;
  const base: Schema = { type, description: schema.description } as Schema;

  if (schema.enum) (base as any).enum = schema.enum;
  if (schema.items) (base as any).items = toGeminiSchema(schema.items);
  if (schema.properties) {
    (base as any).properties = Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, toGeminiSchema(v)]),
    );
  }
  if (schema.required) (base as any).required = schema.required;

  return base;
}

type ContentBlock = { type: "text"; text: string; cache_control?: unknown };
type SystemInput = string | ContentBlock[];
interface MessageParam {
  role: "user" | "assistant";
  content: string;
}
interface CreateParams {
  model: string;
  max_tokens: number;
  system?: SystemInput;
  messages: MessageParam[];
  output_config?: {
    effort?: "low" | "medium" | "high";
    format?: { type: "json_schema"; schema: JsonSchema };
  };
}
interface AnthropicLikeResponse {
  content: { type: "text"; text: string }[];
}

function flattenSystem(system?: SystemInput): string {
  if (!system) return "";
  if (typeof system === "string") return system;
  return system.map((b) => b.text).join("\n\n");
}

export const anthropic = {
  messages: {
    async create(params: CreateParams): Promise<AnthropicLikeResponse> {
      const jsonFormat = params.output_config?.format;
      const model = genAI.getGenerativeModel({
        model: params.model,
        systemInstruction: flattenSystem(params.system) || undefined,
        generationConfig: {
          maxOutputTokens: params.max_tokens,
          ...(jsonFormat
            ? {
                responseMimeType: "application/json",
                responseSchema: toGeminiSchema(jsonFormat.schema),
              }
            : {}),
        },
      });

      const contents = params.messages.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

      const result = await model.generateContent({ contents });
      const text = result.response.text();
      return { content: [{ type: "text", text }] };
    },
  },
};
