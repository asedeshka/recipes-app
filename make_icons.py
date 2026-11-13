from PIL import Image, ImageDraw

S = 512
img = Image.new("RGB", (S, S), "#ff7043")
d = ImageDraw.Draw(img)
w = "#ffffff"

# миска
d.pieslice((126, 200, 386, 440), 0, 180, fill=w)
d.rounded_rectangle((116, 306, 396, 336), radius=15, fill=w)
d.rounded_rectangle((206, 430, 306, 456), radius=12, fill=w)

# пара
for x in (216, 256, 296):
    d.line((x, 220, x, 280), fill=w, width=16)
    d.ellipse((x - 8, 212, x + 8, 228), fill=w)
    d.ellipse((x - 8, 272, x + 8, 288), fill=w)

img.save("icon-512.png")
img.resize((192, 192), Image.LANCZOS).save("icon-192.png")
print("Готово: icon-192.png і icon-512.png")
