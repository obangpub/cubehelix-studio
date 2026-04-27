"""Formatters for RGB triples."""

from __future__ import annotations


def to_hex(rgb: tuple[float, float, float]) -> str:
    r, g, b = rgb
    return f"#{round(r * 255):02x}{round(g * 255):02x}{round(b * 255):02x}"


def to_rgb_255(rgb: tuple[float, float, float]) -> tuple[int, int, int]:
    r, g, b = rgb
    return round(r * 255), round(g * 255), round(b * 255)
