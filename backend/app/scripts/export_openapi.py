"""
OpenAPI Schema Exporter for SettleCart

Exports the authoritative OpenAPI 3.1.0 specification from the FastAPI app instance
to `backend/openapi.json` and optionally mirrors it to `frontend/openapi.json`.
Also injects the standard ErrorEnvelope (AppException) schema into components to ensure
TypeScript generators have full error envelope typings.
"""
import argparse
import json
import logging
import sys
from pathlib import Path

from app.main import app

logger = logging.getLogger(__name__)

# Standard error envelope matching app/core/exceptions.py
ERROR_ENVELOPE_SCHEMA = {
    "type": "object",
    "properties": {
        "error": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Standard error code string (e.g. not_found, bad_request, unauthorized, validation_error, rate_limit_exceeded)",
                },
                "message": {
                    "type": "string",
                    "description": "Human-readable description of the error",
                },
                "details": {
                    "type": "array",
                    "items": {"type": "object", "additionalProperties": True},
                    "description": "Optional validation error details or diagnostic context",
                },
            },
            "required": ["code", "message"],
        }
    },
    "required": ["error"],
}


def generate_openapi_schema() -> dict:
    """Generate OpenAPI schema from FastAPI app, augmenting with ErrorEnvelope."""
    schema = app.openapi()
    components = schema.setdefault("components", {})
    schemas = components.setdefault("schemas", {})
    if "AppException" not in schemas:
        schemas["AppException"] = ERROR_ENVELOPE_SCHEMA
    if "ErrorEnvelope" not in schemas:
        schemas["ErrorEnvelope"] = ERROR_ENVELOPE_SCHEMA
    return schema


def export_openapi(output_path: Path, mirror_path: Path | None = None) -> dict:
    schema = generate_openapi_schema()

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)
        f.write("\n")
    print(f"Exported backend OpenAPI schema to: {output_path}")

    if mirror_path:
        mirror_path = Path(mirror_path)
        mirror_path.parent.mkdir(parents=True, exist_ok=True)
        with open(mirror_path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2)
            f.write("\n")
        print(f"Mirrored OpenAPI schema to: {mirror_path}")

    return schema


def main():
    parser = argparse.ArgumentParser(description="Export SettleCart OpenAPI schema")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("openapi.json"),
        help="Target output file path for backend openapi.json",
    )
    parser.add_argument(
        "--mirror",
        "-m",
        type=Path,
        default=None,
        help="Optional target mirror file path (e.g. ../frontend/openapi.json)",
    )
    args = parser.parse_args()
    export_openapi(args.output, args.mirror)


if __name__ == "__main__":
    main()
