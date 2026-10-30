"""Download reviewed UniProt records and export a small, labeled protein panel.

Existing raw records are reused so that rerunning preserves this snapshot.
Use the EMBL-EBI Proteins API because the main UniProt endpoint was unavailable.
"""

from utils.python_version import ensure_supported_python

ensure_supported_python()

import csv
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import textwrap
import urllib.request


ROOT = Path(__file__).resolve().parent.parent / "source" / "public"
AMR = ['P62593', 'C7C422', 'P0AD64', 'P00811', 'P00552', 'P14509', 'P22782', 'Q53770', 'Q8Y6I2', 'P07944']
CONTROLS = ['P0A9B2', 'P0A6P9', 'P61889', 'P0A799', 'P0A858', 'P0A6T1', 'P08200', 'P0A7D4', 'P00509', 'P0A9G6']


def sequences(path):
    sequence = []
    for line in path.read_text().splitlines():
        if line.startswith('>'):
            if sequence:
                yield ''.join(sequence).upper()
            sequence = []
        elif line.strip():
            sequence.append(line.strip())
    if sequence:
        yield ''.join(sequence).upper()


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    card = ROOT.parent / 'provided' / 'protein_fasta_protein_homolog_model.fasta'
    card_hashes = {hashlib.sha256(s.encode('ascii')).hexdigest() for s in sequences(card)} if card.is_file() else set()
    rows = []
    all_fasta = []
    seen = set()
    for group, accessions, expected in [('amr', AMR, 1), ('non_amr_controls', CONTROLS, 0)]:
        group_fasta = []
        (ROOT / group).mkdir(exist_ok=True)
        (ROOT / 'metadata').mkdir(exist_ok=True)
        for accession in accessions:
            url = f'https://www.ebi.ac.uk/proteins/api/proteins/{accession}'
            metadata_path = ROOT / 'metadata' / f'{accession}.json'
            if not metadata_path.exists():
                request = urllib.request.Request(url, headers={'Accept': 'application/json'})
                with urllib.request.urlopen(request, timeout=45) as response:
                    metadata_path.write_bytes(response.read())
            data = json.loads(metadata_path.read_text())
            assert data['accession'] == accession
            assert data['info']['type'] == 'Swiss-Prot'
            keywords = [k['value'] for k in data.get('keywords', [])]
            assert ('Antibiotic resistance' in keywords) == bool(expected), accession
            assert 'Bacteria' in data['organism']['lineage'], accession
            sequence = data['sequence']['sequence']
            assert re.fullmatch('[ACDEFGHIKLMNPQRSTVWY]{30,}', sequence), accession
            assert len(sequence) == data['sequence']['length']
            digest = hashlib.sha256(sequence.encode('ascii')).hexdigest()
            assert digest not in seen, 'Duplicate sequence'
            seen.add(digest)
            name = data['protein']['recommendedName']['fullName']['value']
            organism = next(n['value'] for n in data['organism']['names'] if n['type'] == 'scientific')
            gene = next((g['name']['value'] for g in data.get('gene', []) if 'name' in g), '')
            functions = ' '.join(t['value'] for c in data.get('comments', []) if c['type'] == 'FUNCTION' for t in c.get('text', []))
            evidence = [r.get('citation', {}).get('dbReference', []) for r in data.get('references', [])]
            pmids = sorted({x['id'] for refs in evidence for x in refs if x['type'] == 'PubMed'})
            fasta = f'>sp|{accession}|{data["id"]} {name} OS={organism} OX={data["organism"]["taxonomy"]}'
            if gene:
                fasta += f' GN={gene}'
            fasta += f' SV={data["sequence"]["version"]}\n' + '\n'.join(textwrap.wrap(sequence, 60)) + '\n'
            relative = f'{group}/{accession}.fasta'
            (ROOT / relative).write_text(fasta)
            group_fasta.append(fasta)
            rows.append({
                'accession': accession, 'protein_name': name, 'gene': gene,
                'organism': organism, 'length': len(sequence),
                'expected_class': expected,
                'expected_label': 'AMR reference' if expected else 'Presumed non-AMR control',
                'label_basis': 'Reviewed resistance annotation and KW-0046' if expected else 'Reviewed metabolic function; no KW-0046 annotation; presumed negative only',
                'relative_fasta': relative, 'sequence_sha256': digest,
                'source_url': f'https://www.uniprot.org/uniprotkb/{accession}/entry',
                'download_url': url, 'downloaded_on_local_date': datetime.fromtimestamp(metadata_path.stat().st_mtime).astimezone().date().isoformat(),
                'entry_version': data['info']['version'],
                'sequence_version': data['sequence']['version'],
                'metadata_sha256': hashlib.sha256(metadata_path.read_bytes()).hexdigest(),
                'exact_match_in_supplied_card': str(digest in card_hashes).lower() if card.is_file() else 'unknown',
                'function_annotation': functions, 'pubmed_ids': ';'.join(pmids),
            })
        (ROOT / f'{group}.fasta').write_text(''.join(group_fasta))
        all_fasta.extend(group_fasta)
    (ROOT / 'combined.fasta').write_text(''.join(all_fasta))
    with (ROOT / 'manifest.csv').open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f'Exported {len(AMR)} AMR references and {len(CONTROLS)} presumed negative protein controls.')
    print('Exact matches in supplied CARD:', [r['accession'] for r in rows if r['exact_match_in_supplied_card'] == 'true'])


if __name__ == '__main__':
    main()
