#!/usr/bin/env python3
"""Genererer PWA-ikonene i public/.

Ingen eksterne avhengigheter — verken Pillow eller en SVG-rasterizer finnes
nødvendigvis på maskina. PNG-ene skrives direkte med zlib, og motivet tegnes
med avstandsfunksjoner som samples 3x3 ganger per piksel for kantutjevning.

Kjør én gang:  npm run ikoner
"""
import math
import struct
import zlib
from pathlib import Path

GRONN = (0x1B, 0x4D, 0x3E)
KRITT = (0xF5, 0xF1, 0xE8)
UT = Path(__file__).resolve().parent.parent / 'public'
SS = 3


def skriv_png(sti, bredde, hoyde, piksler):
    raw = b''.join(
        b'\x00' + piksler[y * bredde * 4:(y + 1) * bredde * 4] for y in range(hoyde)
    )

    def blokk(merke, data):
        crc = zlib.crc32(merke + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + merke + data + struct.pack('>I', crc)

    png = (
        b'\x89PNG\r\n\x1a\n'
        + blokk(b'IHDR', struct.pack('>IIBBBBB', bredde, hoyde, 8, 6, 0, 0, 0))
        + blokk(b'IDAT', zlib.compress(raw, 9))
        + blokk(b'IEND', b'')
    )
    sti.write_bytes(png)


def rund_boks(x, y, halv_b, halv_h, radius):
    """Signert avstand til et rektangel med avrundede hjørner."""
    qx = abs(x) - halv_b + radius
    qy = abs(y) - halv_h + radius
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - radius


def tegn(storrelse, skala, full_utfall):
    n = storrelse * SS
    ut = bytearray(storrelse * storrelse * 4)
    bakgrunn_radius = 0.0 if full_utfall else 0.2237
    piksel = 1.0 / n

    for py in range(storrelse):
        for px in range(storrelse):
            sum_r = sum_g = sum_b = sum_a = 0.0
            for sy in range(SS):
                for sx in range(SS):
                    u = (px * SS + sx + 0.5) / n - 0.5
                    v = (py * SS + sy + 0.5) / n - 0.5

                    d_bak = rund_boks(u, v, 0.5, 0.5, bakgrunn_radius)
                    a_bak = min(max(0.5 - d_bak / piksel, 0.0), 1.0)

                    gu, gv = u / skala, v / skala
                    d_kropp = rund_boks(gu, gv - 0.115, 0.315, 0.175, 0.045)
                    d_hank = max(
                        abs(math.hypot(gu, gv + 0.055) - 0.115) - 0.026,
                        gv + 0.055,
                    )
                    d_motiv = min(d_kropp, d_hank)
                    a_motiv = min(max(0.5 - d_motiv / (piksel / skala), 0.0), 1.0) * a_bak

                    sum_r += GRONN[0] * a_bak * (1 - a_motiv) + KRITT[0] * a_motiv
                    sum_g += GRONN[1] * a_bak * (1 - a_motiv) + KRITT[1] * a_motiv
                    sum_b += GRONN[2] * a_bak * (1 - a_motiv) + KRITT[2] * a_motiv
                    sum_a += a_bak

            antall = SS * SS
            i = (py * storrelse + px) * 4
            ut[i:i + 4] = bytes((
                round(sum_r / antall),
                round(sum_g / antall),
                round(sum_b / antall),
                round(255 * sum_a / antall),
            ))
    return bytes(ut)


def main():
    UT.mkdir(parents=True, exist_ok=True)
    # Maskable-ikonet må gå helt ut i kanten og holde motivet innenfor den
    # midtre 80 %-sirkelen, siden Android beskjærer det til vilkårlig form.
    for navn, storrelse, skala, full in [
        ('ikon-192.png', 192, 1.0, False),
        ('ikon-512.png', 512, 1.0, False),
        ('ikon-maskable-512.png', 512, 0.72, True),
    ]:
        skriv_png(UT / navn, storrelse, storrelse, tegn(storrelse, skala, full))
        print('skrev', navn)


if __name__ == '__main__':
    main()
