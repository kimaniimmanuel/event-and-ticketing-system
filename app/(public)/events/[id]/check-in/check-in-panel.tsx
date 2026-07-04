"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CameraOff, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { checkInAction, type CheckInResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const READER_ID = "qr-reader";

function ResultBanner({ result }: { result: CheckInResult }) {
  const ok = result.status === "success";
  const warn = result.status === "already";
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  const color = ok
    ? "bg-success/10 text-success"
    : warn
      ? "bg-amber-500/10 text-amber-600"
      : "bg-danger/10 text-danger";
  return (
    <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${color}`}>
      <Icon className="h-6 w-6 shrink-0" />
      <div>
        <p className="font-semibold">{result.message}</p>
        {result.attendee && (
          <p className="text-sm">
            {result.attendee}
            {result.at ? ` · checked in at ${result.at}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

export function CheckInPanel({
  eventId,
  initialResult,
}: {
  eventId: string;
  initialResult?: CheckInResult;
}) {
  const [result, setResult] = useState<CheckInResult | undefined>(initialResult);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [isPending, startTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  function submitCode(raw: string) {
    startTransition(async () => {
      const res = await checkInAction(eventId, raw);
      setResult(res);
    });
  }

  async function startScan() {
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText: string) => {
          await scanner.pause(true);
          const res = await checkInAction(eventId, decodedText);
          setResult(res);
          setTimeout(() => {
            try {
              scanner.resume();
            } catch {
              /* scanner may be stopped */
            }
          }, 2000);
        },
        () => {},
      );
      setScanning(true);
    } catch {
      setResult({
        status: "notfound",
        message: "Couldn't start the camera. Grant camera access or use manual entry.",
      });
    }
  }

  async function stopScan() {
    try {
      await scannerRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-5">
      {result && <ResultBanner result={result} />}

      <div>
        <div id={READER_ID} className="mx-auto w-full max-w-sm overflow-hidden rounded-lg" />
        <div className="mt-3 flex justify-center">
          {scanning ? (
            <Button variant="outline" onClick={stopScan}>
              <CameraOff className="h-4 w-4" />
              Stop camera
            </Button>
          ) : (
            <Button onClick={startScan}>
              <Camera className="h-4 w-4" />
              Scan with camera
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Label htmlFor="manual">Or enter a ticket code manually</Label>
        <div className="flex gap-2">
          <Input
            id="manual"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ticket code"
          />
          <Button
            onClick={() => submitCode(manualCode)}
            disabled={isPending || !manualCode.trim()}
          >
            {isPending ? "Checking…" : "Check in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
