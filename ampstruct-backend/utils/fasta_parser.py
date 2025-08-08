from Bio import SeqIO

def parse_fasta(file_path):
    results = []
    for record in SeqIO.parse(file_path, "fasta"):
        results.append({
            "id": record.id,
            "sequence": str(record.seq)
        })
    return results
