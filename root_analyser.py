import sys
import json
import struct
import subprocess
import ROOT
import uproot
import pandas as pd
import matplotlib.pyplot as plt

ROOT.gROOT.SetBatch(True)  # Run in batch mode to avoid GUI popups

def process_ao2d(infile_name, options):
    pdf_path = "/home/fabrizio/Desktop/test_downloader/plots/distributions.pdf"
    
    with uproot.open(infile_name) as f:
        df = []
        for key in f.keys():
            if "DF" in key and "O2hfcanddslite" in key:
                df.append(f[key].arrays(library="pd"))
        df = pd.concat(df, ignore_index=True)

    # Draw all the distributions
    ncols = len(df.columns) // 4 + (len(df.columns) % 4 > 0)
    nrows = 4
    fig, axes = plt.subplots(nrows=nrows, ncols=ncols, figsize=(5*ncols, 20))
    for i, column in enumerate(df.columns):
        ax = axes.flatten()[i]
        df[column].plot(kind='hist', ax=ax, bins=100, alpha=0.7)
        ax.set_title(column)
        ax.set_xlabel(column)
        ax.set_ylabel('Counts')

    plt.tight_layout()
    plt.savefig(pdf_path)
    plt.close(fig)
    
    # Open PDF in Chrome
    try:
        subprocess.Popen(['google-chrome', pdf_path])
    except:
        try:
            subprocess.Popen(['chrome', pdf_path])
        except:
            subprocess.Popen(['xdg-open', pdf_path])

def process_analysis_results(infile_name, options):
    pdf_path = "/home/fabrizio/Desktop/test_downloader/plots/projections.pdf"
    
    with ROOT.TFile.Open(infile_name) as f:
        if options['taskType'] == 'hf-task-ds':
            sparse = f.Get("hf-task-ds/Data/hSparseMass")
        elif options['taskType'] == 'hf-task-flow':
            sparse = f.Get("hf-task-flow-charm-hadrons/hSparseFlowCharm")
        else:
            raise ValueError("Unsupported taskType")

    # Project the THnSparse into a TH1D for each dimension
    projections = [sparse.Projection(i) for i in range(sparse.GetNdimensions())]

    for i_proj, proj in enumerate(projections):
        c = ROOT.TCanvas(f"c_{i_proj}", f"Projection {i_proj}", 800, 600)
        proj.Draw()
        if i_proj == 0:
            c.SaveAs(f"{pdf_path}[")
        elif i_proj == len(projections) - 1:
            c.SaveAs(f"{pdf_path}]")
        else:
            c.SaveAs(pdf_path)
    
    # Open PDF in Chrome
    try:
        subprocess.Popen(['google-chrome', pdf_path])
    except:
        try:
            subprocess.Popen(['chrome', pdf_path])
        except:
            subprocess.Popen(['xdg-open', pdf_path])

def main():
    # Native messaging protocol requires this structure
    while True:
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            break
        length = struct.unpack('@I', raw_length)[0]
        message = json.loads(sys.stdin.buffer.read(length).decode('utf-8'))
        print(message)
        
        if "AnalysisResults.root" in message["filepath"]:
            process_analysis_results(message["filepath"], message["options"])
        elif "AO2D.root" in message["filepath"]:
            process_ao2d(message["filepath"], message["options"])
        
        # Send response (required by protocol)
        response = {"status": "success"}
        encoded = json.dumps(response).encode('utf-8')
        sys.stdout.buffer.write(struct.pack('@I', len(encoded)))
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()

if __name__ == "__main__":
    main()