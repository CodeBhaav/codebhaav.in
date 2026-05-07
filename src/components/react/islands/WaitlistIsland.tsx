import { useState, useEffect } from "react";
import { Providers } from "./Providers";
import { WaitlistWizard } from "../wizard/WaitlistWizard";

const REF_KEY = "cb_ref_code";

function WaitlistInner() {
	const [referralCode, setReferralCode] = useState<string | undefined>();
	const [returnUrl, setReturnUrl] = useState<string>("/waitlist");

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const ref = params.get("ref")?.trim();

		// URL takes precedence; otherwise fall back to a previously-stashed ref.
		if (ref) {
			try {
				localStorage.setItem(REF_KEY, ref);
			} catch {
				/* ignore quota / privacy mode errors */
			}
			setReferralCode(ref);
		} else {
			try {
				const saved = localStorage.getItem(REF_KEY) || undefined;
				if (saved) setReferralCode(saved);
			} catch {
				/* ignore */
			}
		}

		// Build a return URL that preserves the ref through Clerk's OAuth round-trip.
		const here = `${window.location.pathname}${window.location.search}`;
		setReturnUrl(here);
	}, []);

	return (
		<WaitlistWizard referralCode={referralCode} returnUrl={returnUrl} />
	);
}

export default function WaitlistIsland() {
	return (
		<Providers name="WaitlistWizard">
			<WaitlistInner />
		</Providers>
	);
}
