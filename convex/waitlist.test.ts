import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

// `convex-test` discovers Convex modules via Vite's import.meta.glob, which
// the Convex tsconfig doesn't know about. Augment ImportMeta locally so
// `tsc` against convex/tsconfig.json passes without pulling in vite types.
declare global {
	interface ImportMeta {
		glob: (
			pattern: string,
		) => Record<string, () => Promise<unknown>>;
	}
}

const modules = import.meta.glob("./**/*.ts");

function newTest() {
	return convexTest(schema, modules);
}

describe("submitWaitlist", () => {
	it("inserts a row and returns position 1 for the first signup", async () => {
		const t = newTest();
		const result = await t.mutation(api.waitlist.submitWaitlist, {
			name: "Pranav Bhatkar",
			email: "pranav@example.com",
			role: "self-learning",
			reason: "Want to learn in public.",
			interests: ["Frontend"],
		});
		expect(result.position).toBe(1);
		expect(result.referralCode).toMatch(/^[A-Z0-9]{1,5}-[A-Z0-9]{4}$/);
	});

	it("rejects duplicate email", async () => {
		const t = newTest();
		await t.mutation(api.waitlist.submitWaitlist, {
			name: "Pranav",
			email: "dupe@example.com",
			role: "self-learning",
			reason: "First signup.",
			interests: ["Frontend"],
		});
		await expect(
			t.mutation(api.waitlist.submitWaitlist, {
				name: "Pranav 2",
				email: "dupe@example.com",
				role: "self-learning",
				reason: "Second.",
				interests: ["Backend"],
			}),
		).rejects.toThrow(/Already on the waitlist/);
	});

	it("increments the referrer's count when referredBy matches", async () => {
		const t = newTest();
		const ref = await t.mutation(api.waitlist.submitWaitlist, {
			name: "Pranav",
			email: "ref@example.com",
			role: "professional",
			reason: "Referrer.",
			interests: ["Frontend"],
		});
		expect(ref.referralCode).toBeTruthy();

		await t.mutation(api.waitlist.submitWaitlist, {
			name: "Friend",
			email: "friend@example.com",
			role: "student",
			reason: "Joined via ref.",
			interests: ["Mobile"],
			referredBy: ref.referralCode,
		});

		const referrals = await t.query(api.waitlist.getReferrals, {
			email: "ref@example.com",
		});
		expect(referrals?.referralCount).toBe(1);
	});

	it("silently ignores invalid referral codes (does not crash, does not increment)", async () => {
		const t = newTest();
		const ref = await t.mutation(api.waitlist.submitWaitlist, {
			name: "Real Referrer",
			email: "real@example.com",
			role: "professional",
			reason: "Real.",
			interests: ["Frontend"],
		});

		const result = await t.mutation(api.waitlist.submitWaitlist, {
			name: "New User",
			email: "new@example.com",
			role: "student",
			reason: "Bogus ref.",
			interests: ["Backend"],
			referredBy: "DOES-NOT-EXIST",
		});
		expect(result.position).toBe(2);

		const refStats = await t.query(api.waitlist.getReferrals, {
			email: "real@example.com",
		});
		expect(refStats?.referralCount).toBe(0);
	});

	it("stores imageUrl on signup", async () => {
		const t = newTest();
		const result = await t.mutation(api.waitlist.submitWaitlist, {
			name: "Pranav",
			email: "pic@example.com",
			role: "student",
			reason: "With photo.",
			interests: ["UI/UX"],
			imageUrl: "https://img.clerk.com/abc.jpg",
		});
		const referrer = await t.query(api.waitlist.getReferrerByCode, {
			code: result.referralCode,
		});
		expect(referrer?.imageUrl).toBe("https://img.clerk.com/abc.jpg");
	});
});

describe("getReferrerByCode", () => {
	it("returns first name, imageUrl, and referralCount for a real code", async () => {
		const t = newTest();
		const r = await t.mutation(api.waitlist.submitWaitlist, {
			name: "Pranav Bhatkar",
			email: "pranav@example.com",
			role: "self-learning",
			reason: "—",
			interests: ["Frontend"],
			imageUrl: "https://img.clerk.com/p.jpg",
		});
		const referrer = await t.query(api.waitlist.getReferrerByCode, {
			code: r.referralCode,
		});
		expect(referrer).toMatchObject({
			firstName: "Pranav",
			imageUrl: "https://img.clerk.com/p.jpg",
			referralCount: 0,
		});
	});

	it("returns null for unknown code", async () => {
		const t = newTest();
		const referrer = await t.query(api.waitlist.getReferrerByCode, {
			code: "DOES-NOT-EXIST",
		});
		expect(referrer).toBeNull();
	});

	it("falls back firstName to 'Someone' when name is empty", async () => {
		const t = newTest();
		const r = await t.mutation(api.waitlist.submitWaitlist, {
			name: "   ",
			email: "ghost@example.com",
			role: "student",
			reason: "—",
			interests: ["Backend"],
		});
		const referrer = await t.query(api.waitlist.getReferrerByCode, {
			code: r.referralCode,
		});
		expect(referrer?.firstName).toBe("Someone");
	});
});

describe("getPosition", () => {
	it("returns null for unknown email", async () => {
		const t = newTest();
		const pos = await t.query(api.waitlist.getPosition, {
			email: "nobody@example.com",
		});
		expect(pos).toBeNull();
	});

	it("returns rank starting at 1 in signup order", async () => {
		const t = newTest();
		await t.mutation(api.waitlist.submitWaitlist, {
			name: "First",
			email: "a@example.com",
			role: "student",
			reason: "—",
			interests: ["Frontend"],
		});
		await t.mutation(api.waitlist.submitWaitlist, {
			name: "Second",
			email: "b@example.com",
			role: "student",
			reason: "—",
			interests: ["Backend"],
		});
		const a = await t.query(api.waitlist.getPosition, {
			email: "a@example.com",
		});
		const b = await t.query(api.waitlist.getPosition, {
			email: "b@example.com",
		});
		expect(a?.position).toBe(1);
		expect(b?.position).toBe(2);
	});
});

describe("getCount", () => {
	it("returns 0 for empty waitlist", async () => {
		const t = newTest();
		const { count } = await t.query(api.waitlist.getCount, {});
		expect(count).toBe(0);
	});

	it("counts every signup", async () => {
		const t = newTest();
		for (let i = 0; i < 3; i++) {
			await t.mutation(api.waitlist.submitWaitlist, {
				name: `User ${i}`,
				email: `u${i}@example.com`,
				role: "student",
				reason: "—",
				interests: ["Frontend"],
			});
		}
		const { count } = await t.query(api.waitlist.getCount, {});
		expect(count).toBe(3);
	});
});

describe("getTopReferrers", () => {
	it("returns referrers ordered by referralCount desc with masked names", async () => {
		const t = newTest();
		const a = await t.mutation(api.waitlist.submitWaitlist, {
			name: "Alpha User",
			email: "alpha@example.com",
			role: "self-learning",
			reason: "—",
			interests: ["Frontend"],
		});
		const b = await t.mutation(api.waitlist.submitWaitlist, {
			name: "Beta User",
			email: "beta@example.com",
			role: "self-learning",
			reason: "—",
			interests: ["Backend"],
		});

		// Beta gets 2 referrals, Alpha gets 1
		await t.mutation(api.waitlist.submitWaitlist, {
			name: "C",
			email: "c@example.com",
			role: "student",
			reason: "—",
			interests: ["Mobile"],
			referredBy: a.referralCode,
		});
		await t.mutation(api.waitlist.submitWaitlist, {
			name: "D",
			email: "d@example.com",
			role: "student",
			reason: "—",
			interests: ["Mobile"],
			referredBy: b.referralCode,
		});
		await t.mutation(api.waitlist.submitWaitlist, {
			name: "E",
			email: "e@example.com",
			role: "student",
			reason: "—",
			interests: ["Mobile"],
			referredBy: b.referralCode,
		});

		const top = await t.query(api.waitlist.getTopReferrers, {});
		// First two should be the referrers, in count-desc order.
		const first = top[0];
		const second = top[1];
		expect(first.referralCount).toBe(2);
		expect(second.referralCount).toBe(1);
		// Names should be masked, not raw
		expect(first.name).not.toBe("Beta User");
		expect(first.name).toContain("***");
	});
});
