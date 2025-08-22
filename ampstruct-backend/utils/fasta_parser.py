from Bio import SeqIO
import re

def parse_fasta(file_path):
    results = []
    pattern = re.compile("^[ACDEFGHIKLMNPQRSTVWY]+$", re.IGNORECASE)  # standard amino acids only

    for record in SeqIO.parse(file_path, "fasta"):
        seq_str = str(record.seq)
        results.append({
            "id": record.id,
            "sequence": seq_str,
            "length": len(seq_str),
            "valid": bool(pattern.fullmatch(seq_str))
        })

    return results
