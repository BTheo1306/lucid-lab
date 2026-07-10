#!/usr/bin/env python3
"""Parse a GLB, sample N points on its surface (area-weighted), bake a soft
lambert shade per point, normalize pose/scale, write a .bin for the site and
a scatter preview PNG for visual verification.

Usage: python3 sample_brain.py brain.glb out.bin preview.png [yaw_deg] [pitch_deg]
"""
import json, struct, sys, math, random

random.seed(20260710)

glb_path, bin_path, png_path = sys.argv[1], sys.argv[2], sys.argv[3]
yaw = math.radians(float(sys.argv[4]) if len(sys.argv) > 4 else 0)
pitch = math.radians(float(sys.argv[5]) if len(sys.argv) > 5 else 0)
N = 14000

# ── GLB parsing ──────────────────────────────────────────────────────────────
data = open(glb_path, 'rb').read()
magic, version, length = struct.unpack('<III', data[:12])
assert magic == 0x46546C67, 'not a GLB'
off = 12
gltf = None
binchunk = None
while off < length:
    clen, ctype = struct.unpack('<II', data[off:off+8])
    payload = data[off+8:off+8+clen]
    if ctype == 0x4E4F534A:  # JSON
        gltf = json.loads(payload.decode('utf-8'))
    elif ctype == 0x004E4942:  # BIN
        binchunk = payload
    off += 8 + clen

def read_accessor(idx):
    acc = gltf['accessors'][idx]
    bv = gltf['bufferViews'][acc['bufferView']]
    base = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    ncomp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[acc['type']]
    ctype = acc['componentType']
    fmt = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}[ctype]
    size = struct.calcsize(fmt)
    stride = bv.get('byteStride', size * ncomp)
    out = []
    for k in range(count):
        o = base + k * stride
        vals = struct.unpack_from('<' + fmt * ncomp, binchunk, o)
        out.append(vals if ncomp > 1 else vals[0])
    return out

def node_matrix(node):
    if 'matrix' in node:
        m = node['matrix']  # column-major
        return [[m[0], m[4], m[8], m[12]], [m[1], m[5], m[9], m[13]],
                [m[2], m[6], m[10], m[14]], [m[3], m[7], m[11], m[15]]]
    t = node.get('translation', [0, 0, 0])
    q = node.get('rotation', [0, 0, 0, 1])
    s = node.get('scale', [1, 1, 1])
    x, y, z, w = q
    R = [[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
         [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
         [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]]
    M = [[R[r][c] * s[c] for c in range(3)] + [t[r]] for r in range(3)]
    M.append([0, 0, 0, 1])
    return M

def mat_mul(A, B):
    return [[sum(A[r][k] * B[k][c] for k in range(4)) for c in range(4)] for r in range(4)]

def apply(M, v):
    return tuple(M[r][0]*v[0] + M[r][1]*v[1] + M[r][2]*v[2] + M[r][3] for r in range(3))

IDENT = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
tris = []  # (p0, p1, p2)

def walk(node_idx, parent):
    node = gltf['nodes'][node_idx]
    M = mat_mul(parent, node_matrix(node))
    if 'mesh' in node:
        mesh = gltf['meshes'][node['mesh']]
        for prim in mesh.get('primitives', []):
            if prim.get('mode', 4) != 4 or 'POSITION' not in prim.get('attributes', {}):
                continue
            verts = [apply(M, v) for v in read_accessor(prim['attributes']['POSITION'])]
            if 'indices' in prim:
                idx = read_accessor(prim['indices'])
            else:
                idx = list(range(len(verts)))
            for k in range(0, len(idx) - 2, 3):
                tris.append((verts[idx[k]], verts[idx[k+1]], verts[idx[k+2]]))
    for child in node.get('children', []):
        walk(child, M)

scene = gltf['scenes'][gltf.get('scene', 0)]
for n in scene['nodes']:
    walk(n, IDENT)
print(f'triangles: {len(tris)}')

# ── Area-weighted surface sampling with per-point lambert shade ─────────────
def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def norm(a):
    l = math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]) or 1
    return (a[0]/l, a[1]/l, a[2]/l)

areas = []
normals = []
for (p0, p1, p2) in tris:
    c = cross(sub(p1, p0), sub(p2, p0))
    area = 0.5 * math.sqrt(c[0]**2 + c[1]**2 + c[2]**2)
    areas.append(area)
    normals.append(norm(c))
total = sum(areas)
cum = []
acc = 0
for a in areas:
    acc += a
    cum.append(acc)

import bisect
pts = []
shades = []
LIGHT = norm((0.35, 0.7, 0.65))  # front-top light
for _ in range(N):
    r = random.random() * total
    ti = bisect.bisect_left(cum, r)
    p0, p1, p2 = tris[ti]
    u, v = random.random(), random.random()
    if u + v > 1:
        u, v = 1-u, 1-v
    p = tuple(p0[c] + u*(p1[c]-p0[c]) + v*(p2[c]-p0[c]) for c in range(3))
    n = normals[ti]
    lam = max(0.0, n[0]*LIGHT[0] + n[1]*LIGHT[1] + n[2]*LIGHT[2])
    shades.append(0.35 + 0.65 * lam)
    pts.append(p)

# ── Normalize: center, scale height to 2.0, then pose (yaw/pitch) ───────────
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; zs = [p[2] for p in pts]
cx, cy, cz = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2, (min(zs)+max(zs))/2
h = (max(ys)-min(ys)) or 1
s = 2.0 / h
cy2, sy2 = math.cos(yaw), math.sin(yaw)
cp, sp = math.cos(pitch), math.sin(pitch)
out = []
kept_shades = []
for (x, y, z), sh in zip(pts, shades):
    x, y, z = (x-cx)*s, (y-cy)*s, (z-cz)*s
    # cut the brainstem stalk (narrow protrusion under the center)
    if y < -0.58 and (x*x + z*z) ** 0.5 < 0.34:
        continue
    # gentle dissolve toward the bottom, like the reference
    if y < -0.42:
        d = min(1.0, (-y - 0.42) / 0.55)
        if random.random() < d * d * 0.75:
            continue
        sh *= 1 - 0.6 * d
    x, z = x*cy2 - z*sy2, x*sy2 + z*cy2
    y, z = y*cp - z*sp, y*sp + z*cp
    out.append((x, y, z))
    kept_shades.append(sh)
shades = kept_shades
print(f'kept {len(out)} pts after stem cut + dissolve')

while len(out) < N:
    k = random.randrange(len(out))
    out.append(out[k]); shades.append(shades[k])
out = out[:N]; shades = shades[:N]
with open(bin_path, 'wb') as f:
    for (p, sh) in zip(out, shades):
        f.write(struct.pack('<4f', p[0], p[1], p[2], sh))
print(f'wrote {bin_path} ({len(out)} pts)')

# ── Preview render (front camera, additive-ish scatter) ─────────────────────
from PIL import Image
W, H = 900, 620
img = [[0.0]*W for _ in range(H)]
zmin, zmax = min(p[2] for p in out), max(p[2] for p in out)
scale_px = 230
for (x, y, z), sh in zip(out, shades):
    px = int(W/2 + x*scale_px)
    py = int(H/2 - y*scale_px)
    if 0 <= px < W and 0 <= py < H:
        depth = (z - zmin) / ((zmax - zmin) or 1)
        val = (0.25 + 0.75*depth) * sh
        img[py][px] = min(3.0, img[py][px] + val)
im = Image.new('RGB', (W, H), (10, 10, 10))
px_access = im.load()
for yy in range(H):
    for xx in range(W):
        v = min(1.0, img[yy][xx] / 1.6)
        px_access[xx, yy] = (int(10+235*v), int(10+170*v), int(10+70*v))
im.save(png_path)
print(f'wrote {png_path}')
