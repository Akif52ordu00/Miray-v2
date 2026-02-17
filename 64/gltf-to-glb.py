#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
glTF'yi GLB'ye dönüştür
"""

import json
import struct
import os
import sys

def gltf_to_glb(gltf_path, glb_path):
    """glTF dosyasını GLB'ye dönüştür"""
    try:
        # glTF dosyasını oku
        with open(gltf_path, 'r', encoding='utf-8') as f:
            gltf_data = json.load(f)
        
        # Bin dosyasını oku
        bin_path = os.path.join(os.path.dirname(gltf_path), gltf_data.get('buffers', [{}])[0].get('uri', ''))
        if not os.path.exists(bin_path):
            print(f"❌ Bin dosyası bulunamadı: {bin_path}")
            return False
        
        with open(bin_path, 'rb') as f:
            bin_data = f.read()
        
        # JSON'u string'e çevir
        json_data = json.dumps(gltf_data, separators=(',', ':')).encode('utf-8')
        
        # GLB formatı: Header + JSON Chunk + Binary Chunk
        # Header: 12 bytes
        # JSON Chunk: 8 bytes (length + type) + JSON data
        # Binary Chunk: 8 bytes (length + type) + Binary data
        
        json_chunk_length = len(json_data)
        binary_chunk_length = len(bin_data)
        
        # Header: magic (4) + version (4) + length (4)
        glb_length = 12 + 8 + json_chunk_length + 8 + binary_chunk_length
        
        with open(glb_path, 'wb') as f:
            # Header
            f.write(struct.pack('<I', 0x46546C67))  # "glTF" magic
            f.write(struct.pack('<I', 2))  # Version 2
            f.write(struct.pack('<I', glb_length))  # Total length
            
            # JSON Chunk
            f.write(struct.pack('<I', json_chunk_length))  # Chunk length
            f.write(struct.pack('<I', 0x4E4F534A))  # "JSON" type
            f.write(json_data)
            
            # Binary Chunk
            f.write(struct.pack('<I', binary_chunk_length))  # Chunk length
            f.write(struct.pack('<I', 0x004E4942))  # "BIN\0" type
            f.write(bin_data)
        
        print(f"✅ GLB dosyası oluşturuldu: {glb_path}")
        return True
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        return False

if __name__ == "__main__":
    gltf_file = "modül/scene.gltf"
    glb_file = "modül/goril.glb"
    
    if os.path.exists(gltf_file):
        print(f"🔄 glTF'den GLB'ye dönüştürülüyor...")
        print(f"   Kaynak: {gltf_file}")
        print(f"   Hedef: {glb_file}")
        print()
        
        if gltf_to_glb(gltf_file, glb_file):
            print()
            print("✅ Dönüştürme tamamlandı!")
        else:
            print()
            print("❌ Dönüştürme başarısız!")
            sys.exit(1)
    else:
        print(f"❌ glTF dosyası bulunamadı: {gltf_file}")
        sys.exit(1)

