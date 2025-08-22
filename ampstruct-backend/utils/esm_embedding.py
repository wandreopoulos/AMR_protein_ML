import torch
import os
from esm import Alphabet, pretrained
from argparse import Namespace

print("🔁 Loading correct ESM2 model (650M)...")

model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../model/esm2_t33_650M_UR50D.pt"))

# ✅ Safe unpickling
with torch.serialization.safe_globals({ "argparse.Namespace": Namespace }):
    model_esm, alphabet = torch.load(model_path, map_location="cpu")

batch_converter = alphabet.get_batch_converter()
model_esm.eval()

print("✅ ESM2 t33_650M model loaded.")

def get_esm_embedding(sequence: str):
    data = [("sequence", sequence)]
    _, _, tokens = batch_converter(data)
    with torch.no_grad():
        out = model_esm(tokens, repr_layers=[33], return_contacts=False)
        token_representations = out["representations"][33]
        embedding = token_representations[0, 1:len(sequence)+1].mean(0).numpy()
    return embedding
