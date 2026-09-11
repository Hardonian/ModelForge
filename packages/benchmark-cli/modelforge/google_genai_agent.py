"""ModelForge Google GenAI SDK & Vertex AI Agent Builder Interoperability Layer.

Provides native tool definitions and dispatchers compatible with:
1. Google GenAI SDK (`google-genai` / `from google import genai`)
2. Vertex AI Agent Builder Extensions (OpenAPI 3.0.3 Schema)
3. Google Gemini Function Calling
"""

import json
from typing import Any

from modelforge.mcp_server import handle_tool_call, TOOLS


def get_genai_function_declarations() -> list[dict[str, Any]]:
    """Convert ModelForge tools into Google GenAI FunctionDeclaration dictionary format."""
    declarations = []
    for tool in TOOLS:
        decl = {
            "name": tool["name"],
            "description": tool["description"],
            "parameters": tool["inputSchema"],
        }
        declarations.append(decl)
    return declarations


def export_vertex_extension_spec() -> dict[str, Any]:
    """Generate OpenAPI 3.0.3 specification for Vertex AI Agent Builder Extensions."""
    paths: dict[str, Any] = {}

    for tool in TOOLS:
        name = tool["name"]
        op_path = f"/tools/{name}"
        paths[op_path] = {
            "post": {
                "summary": tool["description"],
                "operationId": name,
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": tool["inputSchema"],
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": f"Successful execution of {name}",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "description": f"Result payload for {name}",
                                }
                            }
                        },
                    },
                    "400": {"description": "Invalid input arguments"},
                    "500": {"description": "Internal execution error"},
                },
            }
        }

    return {
        "openapi": "3.0.3",
        "info": {
            "title": "ModelForge Compute Intelligence API for Vertex AI Agent Builder",
            "version": "2.0.0",
            "description": (
                "Empirical compute intelligence, SLO compiler, Google TPU topology planning, "
                "and zero-downtime hot-patching for AI coding and infrastructure agents."
            ),
        },
        "servers": [
            {"url": "https://modelforge.dev/api/v1", "description": "Production ModelForge Gateway"},
            {"url": "http://localhost:3000/api/v1", "description": "Local Development Server"},
        ],
        "paths": paths,
    }


def dispatch_genai_tool_call(tool_name: str, arguments: dict[str, Any]) -> str:
    """Dispatch a tool call received from Google GenAI SDK and return formatted JSON string."""
    result = handle_tool_call(tool_name, arguments)
    return json.dumps(result, indent=2)
