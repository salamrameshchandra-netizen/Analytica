import React, { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  writeBatch, 
  query 
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  db, 
  auth, 
  signInWithGoogle, 
  logoutUser, 
  OperationType, 
  handleFirestoreError,
  firebaseConfig
} from "../firebase";
import { PlayerStats } from "../types";
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  Share2, 
  Key, 
  LogOut, 
  LogIn, 
  Check, 
  Copy, 
  ArrowRight, 
  Lock, 
  Shield, 
  Info, 
  Globe, 
  RefreshCw, 
  UserCheck, 
  X,
  AlertCircle
} from "lucide-react";

function DomainErrorHelper({ hostname, projectId }: { hostname: string; projectId: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2 text-left w-full">
      <div>
        <span className="font-bold text-rose-400 text-[11px] block uppercase tracking-wider mb-1 font-mono">Firebase Auth Domain Restriction</span>
        The domain <code className="px-1 py-0.5 bg-rose-950/45 rounded border border-rose-800 text-[10.5px] font-mono text-rose-300 font-bold">{hostname}</code> is not authorized for Google Sign-in in this Firebase project.
      </div>
      
      {/* Interactive copy block */}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/20 hover:border-rose-500/40 rounded text-[10px] text-rose-200 transition-all font-mono font-bold focus:outline-none cursor-pointer shadow-sm select-none"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-450 shrink-0" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-rose-300 shrink-0" />
              <span>Copy Domain String</span>
            </>
          )}
        </button>
      </div>

      <div className="text-[10px] text-slate-400 leading-normal pl-2.5 border-l-2 border-rose-500/25 font-sans mt-3 space-y-1">
        <span className="font-bold uppercase text-[9px] text-rose-400 block mb-1">Interactive Recovery Steps:</span>
        <div>
          1. Open the {" "}
          <a 
            href={`https://console.firebase.google.com/project/${projectId}/authentication/providers`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5"
          >
            Firebase Console settings page
          </a>.
        </div>
        <div>
          2. Under the <span className="font-medium text-white">"Authorized domains"</span> section, click <span className="font-bold text-white">"Add domain"</span>.
        </div>
        <div>
          3. Paste the copied domain <code className="px-1 bg-slate-900 rounded border border-slate-800 font-mono text-white text-[9.5px]">{hostname}</code> and click <span className="font-bold text-white">Save</span>.
        </div>
        <div className="text-[9px] text-slate-500 font-mono pt-1">
          * Usually updates instantly, though please allow up to 20 seconds.
        </div>
      </div>
    </div>
  );
}

interface CloudSyncHubProps {
  isOpen: boolean;
  onClose: () => void;
  localPlayers: PlayerStats[];
  onImportPlayers: (players: PlayerStats[], mode: "merge" | "overwrite") => void;
  isAutoSyncEnabled: boolean;
  setIsAutoSyncEnabled: (val: boolean) => void;
  isCloudSyncVisible: boolean;
  setIsCloudSyncVisible: (val: boolean) => void;
}

export default function CloudSyncHub({
  isOpen,
  onClose,
  localPlayers,
  onImportPlayers,
  isAutoSyncEnabled,
  setIsAutoSyncEnabled,
  isCloudSyncVisible,
  setIsCloudSyncVisible
}: CloudSyncHubProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudActionLoading, setCloudActionLoading] = useState<"upload" | "download" | "share" | "fetch" | null>(null);
  
  // State for sharing a squad
  const [generatedShareCode, setGeneratedShareCode] = useState<string>("");
  const [copiedShareCode, setCopiedShareCode] = useState(false);

  // State for fetching a shared squad
  const [inputShareCode, setInputShareCode] = useState("");
  const [fetchedPlayers, setFetchedPlayers] = useState<PlayerStats[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // General connection message/error
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  // Sign in / out handlers
  const handleSignIn = async () => {
    try {
      setErrorMessage(null);
      await signInWithGoogle();
      setSuccessMessage("Authenticated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Sign in failed:", err);
      const errStr = String(err);
      if (errStr.includes("popup-blocked") || (err instanceof Error && err.message.includes("popup")) || errStr.toLowerCase().includes("cancelled-by-user") || errStr.toLowerCase().includes("canceled-by-user")) {
        setErrorMessage("Sign-in popup was blocked or closed. Please allow popups in your browser or open the application in a new tab using the URL at the top.");
      } else if (errStr.includes("unauthorized-domain") || errStr.includes("auth/unauthorized-domain")) {
        const hostname = window.location.hostname;
        const projectId = firebaseConfig?.projectId || "restful-gantry-gr5vm";
        setErrorMessage(<DomainErrorHelper hostname={hostname} projectId={projectId} />);
      } else {
        setErrorMessage(`Authentication failed: ${err instanceof Error ? err.message : errStr}. (Tip: If inside the sandboxed iframe, open the app in a new tab to authenticate successfully)`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      setErrorMessage(null);
      await logoutUser();
      setSuccessMessage("Signed out safely.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage("Failed to log out.");
    }
  };

  // Helper to generate unique share code (Alphanumeric uppercase, no confusing digits)
  const generateShortCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "SQR-";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // 1. Upload Squad to Person's secure cloud folder
  const handleUploadToPersonalCloud = async () => {
    if (!currentUser) return;
    setCloudActionLoading("upload");
    setErrorMessage(null);
    setSuccessMessage(null);

    const userFolderDoc = doc(db, "users", currentUser.uid);
    const userPlayersPath = `users/${currentUser.uid}/players`;
    const batch = writeBatch(db);

    try {
      // Step A: Save user record
      await setDoc(userFolderDoc, {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName: currentUser.displayName || "",
        updatedAt: new Date().toISOString()
      });

      // Step B: Query and delete existing player documents under this user
      const existingSnap = await getDocs(collection(db, userPlayersPath));
      existingSnap.forEach((docSnap) => {
        batch.delete(doc(db, userPlayersPath, docSnap.id));
      });

      // Step C: Write new list of players
      localPlayers.forEach((player) => {
        const playerRef = doc(db, userPlayersPath, player.id);
        batch.set(playerRef, player);
      });

      await batch.commit();
      setSuccessMessage(`Backed up ${localPlayers.length} players to your personal cloud folder!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Personal cloud backup failed:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, userPlayersPath);
      } catch (wrappedError) {
        const errMsg = wrappedError instanceof Error ? wrappedError.message : String(wrappedError);
        let cleanedMsg = errMsg;
        try {
          const parsed = JSON.parse(errMsg);
          if (parsed && parsed.error) {
            cleanedMsg = parsed.error;
          }
        } catch (_) {}
        setErrorMessage(`Backup failed: ${cleanedMsg}. Check connection and security rules.`);
      }
    } finally {
      setCloudActionLoading(null);
    }
  };

  // 2. Download Squad from Person's secure cloud folder
  const handleDownloadFromPersonalCloud = async () => {
    if (!currentUser) return;
    setCloudActionLoading("download");
    setErrorMessage(null);
    setSuccessMessage(null);

    const userPlayersPath = `users/${currentUser.uid}/players`;

    try {
      const snap = await getDocs(collection(db, userPlayersPath));
      const playersList: PlayerStats[] = [];
      snap.forEach((docSnap) => {
        playersList.push(docSnap.data() as PlayerStats);
      });

      if (playersList.length === 0) {
        setErrorMessage("No backed up squad was found in your personal cloud folder yet.");
      } else {
        onImportPlayers(playersList, "overwrite");
        setSuccessMessage(`Successfully restored ${playersList.length} players from your personal cloud!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Personal cloud retrieve failed:", err);
      try {
        handleFirestoreError(err, OperationType.GET, userPlayersPath);
      } catch (wrappedError) {
        const errMsg = wrappedError instanceof Error ? wrappedError.message : String(wrappedError);
        let cleanedMsg = errMsg;
        try {
          const parsed = JSON.parse(errMsg);
          if (parsed && parsed.error) {
            cleanedMsg = parsed.error;
          }
        } catch (_) {}
        setErrorMessage(`Retrieval failed: ${cleanedMsg}. Check database permission restrictions and rules.`);
      }
    } finally {
      setCloudActionLoading(null);
    }
  };

  // 3. Share squad publicly generating a unique share code
  const handlePublishSharedSquad = async () => {
    if (localPlayers.length === 0) {
      setErrorMessage("Roster is empty. Put statistics into your squad first before uploading.");
      return;
    }
    setCloudActionLoading("share");
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedShareCode("");

    const code = generateShortCode();
    const docPath = `shared_squads/${code}`;
    const subPath = `shared_squads/${code}/players`;

    try {
      // Create master shared_squad document
      await setDoc(doc(db, "shared_squads", code), {
        code,
        createdAt: new Date().toISOString(),
        playerCount: localPlayers.length,
        ownerEmail: currentUser?.email || "Anonymous"
      });

      // Batch write players under subcollection
      const batch = writeBatch(db);
      localPlayers.forEach((player) => {
        const pRef = doc(db, subPath, player.id);
        batch.set(pRef, player);
      });

      await batch.commit();
      setGeneratedShareCode(code);
      setSuccessMessage("Players uploaded successfully! Share the code with others to collaborate.");
    } catch (err) {
      console.error("Publish shared squad failed:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      } catch (wrappedError) {
        const errMsg = wrappedError instanceof Error ? wrappedError.message : String(wrappedError);
        let cleanedMsg = errMsg;
        try {
          const parsed = JSON.parse(errMsg);
          if (parsed && parsed.error) {
            cleanedMsg = parsed.error;
          }
        } catch (_) {}
        setErrorMessage(`Upload to shared database failed: ${cleanedMsg}. Please verify your Firebase Firestore configuration and ensure security rules are deployed successfully.`);
      }
    } finally {
      setCloudActionLoading(null);
    }
  };

  // 4. Fetch a shared squad using code
  const handleFetchSharedSquad = async () => {
    const cleanCode = inputShareCode.trim().toUpperCase();
    if (!cleanCode) return;

    setCloudActionLoading("fetch");
    setFetchError(null);
    setFetchedPlayers(null);

    const docPath = `shared_squads/${cleanCode}`;
    const subPath = `shared_squads/${cleanCode}/players`;

    try {
      const parentSnap = await getDoc(doc(db, "shared_squads", cleanCode));
      if (!parentSnap.exists()) {
        setFetchError("Invalid share code. No database records found matching this marker.");
        return;
      }

      const playersSnap = await getDocs(collection(db, subPath));
      const playersList: PlayerStats[] = [];
      playersSnap.forEach((docSnap) => {
        playersList.push(docSnap.data() as PlayerStats);
      });

      if (playersList.length === 0) {
        setFetchError("This shared squad is empty.");
      } else {
        setFetchedPlayers(playersList);
      }
    } catch (err) {
      setFetchError("Resource extraction blocked by secure collection gates.");
    } finally {
      setCloudActionLoading(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedShareCode);
    setCopiedShareCode(true);
    setTimeout(() => setCopiedShareCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex justify-center items-center p-4 transition-all animate-fade-in">
      <div className="bg-[#121216] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded border border-emerald-500/20">
              <Cloud className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Cloud Sync & Share Hub</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Persist squad benchmarks across platforms</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info banners */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/20 border border-rose-500/20 rounded flex items-start gap-2 text-[11px] text-rose-450 font-mono leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/10 border border-emerald-500/20 rounded flex items-start gap-2 text-[11px] text-emerald-400 font-mono leading-relaxed">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main tabs/sections */}
        <div className="p-6 space-y-6">
          
          {/* Option 1: Instant Auth-Free Backups & Shared Squads (Best for Vercel / Custom Domains) */}
          <div className="border border-slate-850 p-5 rounded-lg bg-[#141419]/60 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wide">Highly Compatible</span>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wide">Vercel Safe</span>
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 mt-2">
                <Share2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                Auth-Free Squad Backup & Dynamic Share Codes
              </h4>
              <p className="text-[10px] text-slate-400 font-sans mt-1 leading-relaxed">
                Generate an anonymous backup/share code to instantly secure your squad data in the cloud database, or load an existing code. <strong>Requires no logins or Google account authorization</strong>, making it 100% functional on Vercel and custom domains!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Box 1: Generate Share Code / Backup */}
              <div className="border border-slate-800 p-3.5 rounded-md bg-slate-900/40 space-y-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] font-bold text-slate-350 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    Create Backup Code
                  </span>
                  <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                    Save your current {localPlayers.length} players to a secure private cloud code.
                  </p>
                </div>

                {generatedShareCode ? (
                  <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded flex items-center justify-between font-mono text-xs">
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-500 block uppercase font-mono">My Backup/Share Code</span>
                      <span className="text-emerald-400 font-bold tracking-widest text-sm">{generatedShareCode}</span>
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="p-1 px-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 rounded text-[10px] text-slate-300 font-mono transition-all flex items-center gap-1"
                    >
                      {copiedShareCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishSharedSquad}
                    disabled={cloudActionLoading !== null || localPlayers.length === 0}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black text-[10.5px] font-bold rounded flex items-center justify-center gap-1.5 uppercase transition-all tracking-wide disabled:pointer-events-none mt-2 font-mono"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    {cloudActionLoading === "share" ? "Securing backup..." : "Generate Backup Code"}
                  </button>
                )}
              </div>

              {/* Box 2: Fetch and Import shared squad */}
              <div className="border border-slate-850 p-3.5 rounded-md bg-slate-900/40 space-y-3.5">
                <div>
                  <span className="text-[9.5px] font-bold text-slate-350 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    Restore From Backup Code
                  </span>
                  <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                    Input a backup/share code below to fetch and overwrite your current active screen roster.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. SQR-P3J9A"
                    value={inputShareCode}
                    onChange={(e) => setInputShareCode(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-650 rounded focus:border-amber-500 outline-none w-full uppercase font-mono"
                  />
                  <button
                    onClick={handleFetchSharedSquad}
                    disabled={cloudActionLoading === "fetch" || !inputShareCode.trim()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-xs text-white rounded transition-all uppercase tracking-wide shrink-0 font-mono disabled:opacity-40"
                  >
                    {cloudActionLoading === "fetch" ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      "Load"
                    )}
                  </button>
                </div>

                {fetchError && (
                  <p className="text-[9.5px] text-rose-400 font-mono leading-tight bg-rose-950/15 p-2 rounded border border-rose-500/10">
                    {fetchError}
                  </p>
                )}

                {fetchedPlayers && (
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-900 pb-1.5">
                      <span className="text-slate-400 font-mono">Found Squad Roster</span>
                      <span className="text-emerald-400 font-mono font-bold">{fetchedPlayers.length} Players</span>
                    </div>
                    
                    {/* Quick preview scroll */}
                    <div className="max-h-20 overflow-y-auto space-y-1 pr-1 font-mono text-[9.5px]">
                      {fetchedPlayers.map((p, idx) => (
                        <div key={p.id || idx} className="flex justify-between items-center text-slate-450">
                          <span className="truncate max-w-[130px] font-bold text-slate-300">{p.name}</span>
                          <span>{p.state} · {p.role}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          onImportPlayers(fetchedPlayers, "merge");
                          setFetchedPlayers(null);
                          setInputShareCode("");
                          onClose();
                        }}
                        className="w-full py-1.5 bg-[#16161c] hover:bg-slate-900 border border-slate-800 rounded text-[10px] font-extrabold text-emerald-400 font-mono uppercase tracking-wider transition-all"
                      >
                        Merge In
                      </button>
                      <button
                        onClick={() => {
                          onImportPlayers(fetchedPlayers, "overwrite");
                          setFetchedPlayers(null);
                          setInputShareCode("");
                          onClose();
                        }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black rounded text-[10px] font-extrabold font-mono uppercase tracking-wider transition-all"
                      >
                        Overwrite
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Option 2: Google Sign-In & Personal Backup (Auth-Restricted) */}
          <div className="border border-slate-850 p-4 rounded-lg bg-slate-900/20 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Personal Google Cloud Folder
                </h4>
                <p className="text-[10px] text-slate-500 font-sans mt-1">
                  Authenticate with Google to back up your roster in a private, encrypted cloud folder.
                </p>
              </div>

              {authLoading ? (
                <span className="text-[10px] text-slate-500 font-mono animate-pulse">Initializing...</span>
              ) : currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-950/25 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    Verified
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="p-1 px-1.5 text-slate-500 hover:text-rose-400 font-mono text-[9px] uppercase border border-slate-800 bg-[#16161c] rounded hover:border-rose-900 transition-all flex items-center gap-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-2.5 h-2.5" /> Log Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleSignIn}
                  className="px-3 py-1 bg-[#16161c] hover:bg-slate-900 border border-slate-800 text-white rounded text-[10px] font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-400" /> Sign In with Google
                </button>
              )}
            </div>

            {!currentUser && (
              <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/20 rounded text-[9.5px] text-slate-400 leading-normal">
                <span className="font-bold text-amber-500 font-mono text-[9px] uppercase tracking-wider block mb-0.5">⚠️ Domain authorization limit</span>
                Note: Google Sign-in only works on domains authorized in the Firebase console (like the development environment). Because Firebase is managed server-side by AI Studio, <strong>it is prevented from logging in on your custom Vercel domain</strong>. Please use the Vercel-Safe Option 1 above to backup/restore securely!
              </div>
            )}

            {currentUser && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleUploadToPersonalCloud}
                  disabled={cloudActionLoading !== null}
                  className="p-3 bg-slate-900/60 border border-slate-800 rounded hover:border-slate-700 hover:bg-slate-850 text-left transition-all relative overflow-hidden group disabled:opacity-40"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <CloudUpload className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    {cloudActionLoading === "upload" ? "Backing up..." : "Backup Local to Cloud"}
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-sans mt-1">
                    Overwrites your personal safe folder with your current {localPlayers.length} roster statistics.
                  </p>
                </button>

                <button
                  onClick={handleDownloadFromPersonalCloud}
                  disabled={cloudActionLoading !== null}
                  className="p-3 bg-slate-900/60 border border-slate-800 rounded hover:border-slate-700 hover:bg-slate-850 text-left transition-all relative overflow-hidden group disabled:opacity-40"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <CloudDownload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    {cloudActionLoading === "download" ? "Downloading..." : "Restore from Backup"}
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-sans mt-1">
                    Retrieves and writes your stored squad statistics directly to this workspace screen.
                  </p>
                </button>
              </div>
            )}
          </div>

          {/* Section C: Optional Cloud Auto-Sync */}
          {currentUser && (
            <div className="flex items-center justify-between p-3.5 bg-indigo-950/5 border border-indigo-500/15 rounded-lg flex-row">
              <div className="flex gap-2 items-start max-w-sm sm:max-w-md">
                <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase font-mono">Auto-Sync Modifications</h4>
                  <p className="text-[9.5px] text-slate-500 font-sans mt-0.5 leading-relaxed">
                    Instantly save roster modifications (creations, deletions, updates) to your private secure storage cloud folder on the fly.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isAutoSyncEnabled}
                  onChange={(e) => setIsAutoSyncEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-black peer-checked:after:border-black"></div>
              </label>
            </div>
          )}

          {/* Section D: View Preference (Hide/Remove Cloud Sync button from Navigation) */}
          <div className="flex items-center justify-between p-3.5 bg-rose-950/5 border border-rose-950/25 rounded-lg flex-row">
            <div className="flex gap-2.5 items-start max-w-sm sm:max-w-md">
              <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-[11px] font-bold text-white uppercase font-mono">Remove Sync From main bar (Disable)</h4>
                <p className="text-[9.5px] text-slate-500 font-sans mt-0.5 leading-relaxed">
                  Toggle this to completely hide the prominent emerald "Cloud Sync" layout button from the top navigation. (You can re-enable it at any time).
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={!isCloudSyncVisible}
                onChange={(e) => setIsCloudSyncVisible(!e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500 peer-checked:after:bg-black peer-checked:after:border-black"></div>
            </label>
          </div>

        </div>

      </div>
    </div>
  );
}
