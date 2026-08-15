/*
 * scout_link — blind-repetition delivery policy for the daily packet, as pure functions.
 *
 * A lost daily packet costs *timeliness*, not data: the full record is already on the SD
 * card, so the requirement is soft. That rules out ACKed retransmission, which on a
 * many-buoy deployment invites the classic avalanche — every node retrying into the same
 * congested window (carvalho-2021). Blind repetition instead sends the same frame a fixed
 * number of times and never listens for a reply, so the cost is bounded and identical
 * whether the link is perfect or dead.
 *
 * Two rules make the repeats worth sending:
 *
 *   1. They are *spaced*, and the gaps widen. Back-to-back frames share one fade — at a
 *      sub-meter antenna over moving water that is the likeliest way to lose all of them.
 *   2. They are *bounded by the watchdog*. Repeating adds blocking time inside a single
 *      wake, and a policy that outruns WDT_TIMEOUT_MS would reboot the buoy mid-transmit.
 *      `scout_link_fits_watchdog` makes that a tested invariant rather than a hope; the
 *      caller must still pet the watchdog between copies.
 *
 * Kept hardware-free (only <stdint.h>) so the policy is unit-tested off-target.
 *
 * References:
 *     Carvalho, R. et al. (2021) on redundancy vs. retransmission in LoRa networks.
 *     Ali, Z. et al. (2024) on FEC / coding-rate gains for LPWAN links.
 */
#ifndef SCOUT_LINK_H
#define SCOUT_LINK_H

#include <stdint.h>

#include "scout_scheduler.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Shipped policy. Repeating is an energy cost, so it degrades with the pack exactly as
 * sensing and transmit cadence already do (scout_scheduler power modes). */
#define SCOUT_LINK_REPEATS_NORMAL 3
#define SCOUT_LINK_REPEATS_CONSERVE 1
#define SCOUT_LINK_REPEAT_BASE_DELAY_MS 2000u
/* Worst-case time for one send, matching LoraLink::send's waitPacketSent timeout. Real
 * airtime at BW125/SF7/CR4-8 for a 30-byte frame is ~102 ms; this is the blocking budget. */
#define SCOUT_LINK_TX_BUDGET_MS 2000u

/* How many copies of the daily packet to send in this power mode. CRITICAL returns 0. */
uint8_t scout_link_repeat_count(scout_power_mode_t mode, uint8_t normal_repeats,
                                uint8_t conserve_repeats);

/* Gap to wait after `completed` copies have gone out, before sending the next. Widens
 * linearly (base, 2×base, …) so the copies do not sit inside one fade. 0 when completed=0. */
uint32_t scout_link_repeat_delay_ms(uint8_t completed, uint32_t base_delay_ms);

/* Longest stretch the caller can be inside without petting the watchdog: one transmission
 * plus the widest gap that follows it. 0 when nothing is sent. */
uint32_t scout_link_max_segment_ms(uint8_t repeats, uint32_t base_delay_ms,
                                   uint32_t tx_budget_ms);

/* True when that longest stretch leaves at least 2× headroom against the watchdog. */
bool scout_link_fits_watchdog(uint8_t repeats, uint32_t base_delay_ms, uint32_t tx_budget_ms,
                              uint32_t wdt_timeout_ms);

#ifdef __cplusplus
}
#endif
#endif /* SCOUT_LINK_H */
