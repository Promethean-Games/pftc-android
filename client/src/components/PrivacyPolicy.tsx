import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Printer, Trash2 } from "lucide-react";

interface PrivacyPolicyProps {
  onClose: () => void;
}

const ALL_LOCALSTORAGE_KEYS = [
  "currentGame",
  "savedGames",
  "pftc_unlocked",
  "appScreen",
  "appActiveTab",
  "appViewOnly",
  "setupTimes",
  "pftc_leveler_tutorial_seen",
  "pftc_level_home",
  "pftc_level_league",
  "pftc_level_tournament",
  "pftc_terms_accepted",
  "pftc_terms_version",
  "pftc_terms_accepted_at",
  "pftc_device_id",
  "sidebar:state",
];

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDeleteAllData = () => {
    ALL_LOCALSTORAGE_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch {}
    });
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("pftc_")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => {
      try { localStorage.removeItem(key); } catch {}
    });
    setDeleted(true);
    setShowDeleteConfirm(false);
    setTimeout(() => window.location.reload(), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto" data-testid="screen-privacy-policy">
      <div className="max-w-2xl mx-auto p-4 pb-12">
        <div className="flex items-center justify-between gap-2 mb-4 sticky top-0 bg-background py-2 z-10">
          <h1 className="text-xl font-bold" data-testid="text-privacy-title">Terms of Use & Privacy Policy</h1>
          <div className="flex gap-1 flex-wrap">
            <Button size="icon" variant="ghost" onClick={handlePrint} data-testid="button-print-policy">
              <Printer className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-policy">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-4">Promethean Games LLC &middot; Effective Oct 23, 2025</p>

        <div className="space-y-4 text-sm leading-relaxed">
          <Card className="p-4">
            <h2 className="font-semibold mb-2">1. Acceptance</h2>
            <p className="text-muted-foreground">
              By using the Par for the Course Scorekeeper ("App"), you agree to these Terms and this Privacy Policy. If you do not agree, please do not use the App.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">2. Purpose</h2>
            <p className="text-muted-foreground">
              The App is a scorekeeping and training tool for Par for the Course billiards training. It is not for gambling or betting.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">3. Your Use</h2>
            <ul className="text-muted-foreground list-disc pl-4 space-y-1">
              <li>Use the App lawfully and responsibly.</li>
              <li>Do not reverse-engineer, redistribute, or inject harmful content.</li>
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All names, layouts, and designs are &copy; Promethean Games LLC. Do not reuse without written permission.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">5. Warranty & Liability</h2>
            <p className="text-muted-foreground">
              The App is provided "as is". We do not guarantee uptime or error-free operation. Promethean Games LLC is not liable for damages or data loss.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">6. Privacy & Data Collection</h2>
            <ul className="text-muted-foreground list-disc pl-4 space-y-2">
              <li><strong>No personal data</strong> is sent to our servers. Player names, scores, and game settings stay on your device in local browser storage.</li>
              <li><strong>Payment processing</strong> is handled by Stripe. When you purchase the full version, Stripe collects your payment information directly. We do not store or have access to your payment details. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Stripe's Privacy Policy</a>.</li>
              <li><strong>Device sensors</strong>: The Table Leveler feature uses your device's accelerometer/gyroscope. This data is processed locally and is never transmitted to any server.</li>
              <li><strong>Google Fonts</strong>: The App loads fonts from Google's servers. Google may collect standard web request data (IP address, browser type). See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Google's Privacy Policy</a>.</li>
              <li><strong>No third-party ads or analytics</strong>. No tracking cookies or advertising identifiers are used.</li>
              <li><strong>No account required</strong>. The App does not require sign-up, login, or any personal information to use.</li>
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">7. Data Stored on Your Device</h2>
            <p className="text-muted-foreground mb-2">The App stores the following data locally in your browser:</p>
            <ul className="text-muted-foreground list-disc pl-4 space-y-1">
              <li>Game sessions (player names, scores, turn timing)</li>
              <li>Saved games</li>
              <li>App settings (theme, display preferences)</li>
              <li>Purchase unlock status</li>
              <li>Table Leveler calibration data</li>
            </ul>
            <p className="text-muted-foreground mt-2">This data never leaves your device unless you choose to share it.</p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">8. Data Retention & Deletion</h2>
            <p className="text-muted-foreground mb-2">
              Saved games and settings remain on your device until you delete them. You can delete all app data at any time using the button below. Uninstalling the App also removes all local data.
            </p>
            {!deleted ? (
              !showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  data-testid="button-delete-data"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All App Data
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-destructive font-medium text-xs">This will erase all saved games, settings, and unlock status. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} data-testid="button-cancel-delete">
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAllData} data-testid="button-confirm-delete">
                      Confirm Delete
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-green-500 font-medium" data-testid="text-data-deleted">All app data has been deleted. Reloading...</p>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              The App does not knowingly collect personal information from children under 13. Since no personal data is collected or transmitted, the App is suitable for users of all ages.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">10. Changes & Contact</h2>
            <p className="text-muted-foreground mb-2">
              We may update these terms. Continued use after an update means you accept the revised version.
            </p>
            <p className="text-muted-foreground">
              Contact: <a href="mailto:support@promethean-games.com" className="underline">support@promethean-games.com</a> &middot; <a href="https://www.Promethean-Games.com" target="_blank" rel="noopener noreferrer" className="underline">Promethean-Games.com</a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
