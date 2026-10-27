/* Hydrophone capture: preamp on A2 → 12-bit ADC at 22,050 Hz → WAV on the SD card, with every
 * block also fed to the acoustic summary (SCO-231, ADR-0011; summary: ADR-0010).
 *
 *   TC3 overflow ──event──▶ ADC START ──RESRDY──▶ DMA ──▶ ring of AUDIO_DMA_BLOCKS buffers
 *                                                          │ (block-complete interrupt counts)
 *   main loop: wait for a full block → scout_acoustic_feed → 12→16-bit PCM → append to the WAV
 *
 * Sampling is clocked by hardware, not by the main loop, so a slow SD write delays the copy, not
 * the sample. The ring holds AUDIO_DMA_BLOCKS − 1 blocks of slack; if the DMA laps the main loop
 * the recording is reported as failed (dropped samples), never silently short.
 *
 * ⚠️ NOT YET RUN ON HARDWARE. Register settings follow the SAMD21 datasheet (DS40001882):
 * ADC §33, EVSYS §24, TC §30. DMA goes through the Adafruit_ZeroDMA copy bundled with the
 * Adafruit SAMD core (its SPI library already links it and owns DMAC_Handler, so driving the
 * DMAC directly would fight it). Not the registry's 1.1.4: that includes TinyUSB
 * unconditionally and does not build on the default USB stack. Bench checks before trusting it:
 * the sample count (1,323,000 per minute), a test tone's frequency in the WAV, CPU headroom with
 * the summary running, and recording current. See the build plan, Stage 7.
 */
#ifndef SCOUT_DRIVER_AUDIO_CAPTURE_H
#define SCOUT_DRIVER_AUDIO_CAPTURE_H

#include <Adafruit_SleepyDog.h>
#include <Adafruit_ZeroDMA.h>
#include <Arduino.h>
#include <SD.h>
#include <wiring_private.h>

#include "../config.h"
#include "scout_acoustic.h"
#include "scout_capture.h"

/* Why the last record() failed, for the serial log. */
enum AudioCaptureResult {
    AUDIO_OK = 0,
    AUDIO_SD_OPEN_FAILED,
    AUDIO_DMA_FAILED,
    AUDIO_STALLED,        /* no block arrived: ADC/DMA not running */
    AUDIO_OVERRUN,        /* the DMA lapped the main loop: samples were lost */
    AUDIO_SD_WRITE_FAILED,
};

class AudioCapture {
public:
    /* Record `seconds` of audio to /AUDIO/<path>, feeding each block to `summary` (already
     * initialised). Returns true only for a complete clip: every expected sample captured and
     * written, header finalised. On false the partial file stays on the card for diagnosis but
     * the caller reports no recording. */
    bool record(const char *path, uint16_t seconds, ScoutAcoustic *summary) {
        result_ = AUDIO_OK;
        samples_written_ = 0;
        char full[40];
        snprintf(full, sizeof(full), "AUDIO/%s", path);
        char dir[24];
        snprintf(dir, sizeof(dir), "AUDIO/%.8s", path);  /* YYYYMMDD */
        if (!SD.exists(dir) && !SD.mkdir(dir)) {
            return fail(AUDIO_SD_OPEN_FAILED);
        }
        File f = SD.open(full, O_CREAT | O_WRITE | O_TRUNC);
        if (!f) {
            return fail(AUDIO_SD_OPEN_FAILED);
        }
        uint8_t header[SCOUT_WAV_HEADER_SIZE];
        scout_wav_header(header, ACOUSTIC_SAMPLE_RATE_HZ, 0);  /* sizes patched at the end */
        f.write(header, sizeof(header));

        digitalWrite(PIN_AUDIO_GATE, SENSOR_ON);
        delay(AUDIO_PREAMP_WARMUP_MS);
        bool ok = start() && stream(f, seconds, summary);
        stop();
        digitalWrite(PIN_AUDIO_GATE, SENSOR_OFF);

        scout_wav_header(header, ACOUSTIC_SAMPLE_RATE_HZ, samples_written_);
        f.seek(0);
        f.write(header, sizeof(header));
        f.close();
        return ok;
    }

    AudioCaptureResult lastResult() const { return result_; }
    uint32_t lastSamples() const { return samples_written_; }

private:
    static uint16_t buffers_[AUDIO_DMA_BLOCKS][AUDIO_DMA_BLOCK_SAMPLES];
    static volatile uint32_t produced_;
    /* Runs in the DMA interrupt at the end of every block. */
    static void onBlock(Adafruit_ZeroDMA *) { produced_++; }

    Adafruit_ZeroDMA dma_;
    bool dma_ready_ = false;
    AudioCaptureResult result_ = AUDIO_OK;
    uint32_t samples_written_ = 0;
    /* ADC registers saved so analogRead() (battery, turbidity) works again afterwards. */
    uint16_t saved_ctrlb_ = 0, saved_evctrl_ = 0;
    uint8_t saved_refctrl_ = 0, saved_sampctrl_ = 0, saved_avgctrl_ = 0;
    uint32_t saved_inputctrl_ = 0;

    bool fail(AudioCaptureResult why) {
        result_ = why;
        return false;
    }

    static void adcSync() { while (ADC->STATUS.bit.SYNCBUSY) {} }

    bool start() {
        produced_ = 0;
        pinPeripheral(PIN_AUDIO_PREAMP, PIO_ANALOG);
        configureAdc();
        if (!configureDma()) {
            return fail(AUDIO_DMA_FAILED);
        }
        configureEventSystem();
        configureTimer();  /* last: the first overflow starts the first conversion */
        return true;
    }

    void configureAdc() {
        adcSync();
        saved_ctrlb_ = ADC->CTRLB.reg;
        saved_evctrl_ = ADC->EVCTRL.reg;
        saved_refctrl_ = ADC->REFCTRL.reg;
        saved_sampctrl_ = ADC->SAMPCTRL.reg;
        saved_avgctrl_ = ADC->AVGCTRL.reg;
        saved_inputctrl_ = ADC->INPUTCTRL.reg;

        ADC->CTRLA.bit.ENABLE = 0;
        adcSync();
        /* Same reference and gain as analogRead's AR_DEFAULT: VDDANA/2 with ×½ gain = 3.3 V. */
        ADC->REFCTRL.reg = ADC_REFCTRL_REFSEL_INTVCC1;
        ADC->INPUTCTRL.reg =
            ADC_INPUTCTRL_MUXPOS(g_APinDescription[PIN_AUDIO_PREAMP].ulADCChannelNumber) |
            ADC_INPUTCTRL_MUXNEG_GND | ADC_INPUTCTRL_GAIN_DIV2;
        adcSync();
        ADC->AVGCTRL.reg = ADC_AVGCTRL_SAMPLENUM_1 | ADC_AVGCTRL_ADJRES(0);
        /* 48 MHz / 32 = 1.5 MHz ADC clock (max 2.1 MHz); ~7 µs per conversion, well inside the
         * 45 µs sample period. Single conversions, each started by a TC3 event. */
        ADC->SAMPCTRL.reg = ADC_SAMPCTRL_SAMPLEN(5);
        ADC->CTRLB.reg = ADC_CTRLB_PRESCALER_DIV32 | ADC_CTRLB_RESSEL_12BIT;
        adcSync();
        ADC->EVCTRL.reg = ADC_EVCTRL_STARTEI;
        ADC->INTFLAG.reg = ADC_INTFLAG_RESRDY;
        ADC->CTRLA.bit.ENABLE = 1;
        adcSync();
    }

    /* The channel and its descriptor ring are built on the first recording and kept: ZeroDMA's
     * free() does not release descriptors (they are memalign'd), so rebuilding per clip would
     * leak heap and grow the ring. Later clips just restart the job. */
    bool configureDma() {
        if (dma_ready_) {
            return dma_.startJob() == DMA_STATUS_OK;
        }
        dma_.setTrigger(ADC_DMAC_ID_RESRDY);
        dma_.setAction(DMA_TRIGGER_ACTON_BEAT);
        if (dma_.allocate() != DMA_STATUS_OK) {
            return false;
        }
        /* One descriptor per block, linked in a ring, each raising an interrupt when full. */
        for (uint8_t i = 0; i < AUDIO_DMA_BLOCKS; i++) {
            DmacDescriptor *d = dma_.addDescriptor((void *)&ADC->RESULT.reg, buffers_[i],
                                                   AUDIO_DMA_BLOCK_SAMPLES, DMA_BEAT_SIZE_HWORD,
                                                   false, true);
            if (d == nullptr) {
                dma_.free();
                return false;
            }
            d->BTCTRL.bit.BLOCKACT = DMA_BLOCK_ACTION_INT;
        }
        dma_.loop(true);
        dma_.setCallback(onBlock);
        dma_ready_ = true;
        return dma_.startJob() == DMA_STATUS_OK;
    }

    void configureEventSystem() {
        PM->APBCMASK.reg |= PM_APBCMASK_EVSYS;
        /* USER.CHANNEL is channel number + 1 (0 = no channel). */
        EVSYS->USER.reg = EVSYS_USER_CHANNEL(1) | EVSYS_USER_USER(EVSYS_ID_USER_ADC_START);
        EVSYS->CHANNEL.reg = EVSYS_CHANNEL_CHANNEL(0) | EVSYS_CHANNEL_EVGEN(EVSYS_ID_GEN_TC3_OVF) |
                             EVSYS_CHANNEL_PATH_ASYNCHRONOUS;
    }

    void configureTimer() {
        GCLK->CLKCTRL.reg = GCLK_CLKCTRL_CLKEN | GCLK_CLKCTRL_GEN_GCLK0 | GCLK_CLKCTRL_ID_TCC2_TC3;
        while (GCLK->STATUS.bit.SYNCBUSY) {}
        PM->APBCMASK.reg |= PM_APBCMASK_TC3;
        TC3->COUNT16.CTRLA.reg = TC_CTRLA_SWRST;
        while (TC3->COUNT16.CTRLA.bit.SWRST) {}
        TC3->COUNT16.CTRLA.reg = TC_CTRLA_MODE_COUNT16 | TC_CTRLA_WAVEGEN_MFRQ |
                                 TC_CTRLA_PRESCALER_DIV1;
        TC3->COUNT16.CC[0].reg =
            (uint16_t)(scout_capture_timer_period(F_CPU, ACOUSTIC_SAMPLE_RATE_HZ) - 1);
        while (TC3->COUNT16.STATUS.bit.SYNCBUSY) {}
        TC3->COUNT16.EVCTRL.reg = TC_EVCTRL_OVFEO;
        TC3->COUNT16.CTRLA.bit.ENABLE = 1;
        while (TC3->COUNT16.STATUS.bit.SYNCBUSY) {}
    }

    bool stream(File &f, uint16_t seconds, ScoutAcoustic *summary) {
        const uint32_t expected =
            scout_capture_expected_samples(ACOUSTIC_SAMPLE_RATE_HZ, seconds);
        const uint32_t blocks = scout_capture_blocks_needed(expected, AUDIO_DMA_BLOCK_SAMPLES);
        uint32_t consumed = 0;
        uint32_t last_block_ms = millis();
        while (consumed < blocks) {
            Watchdog.reset();  /* a clip is 60 s, the watchdog 16 s */
            uint32_t produced = produced_;
            if (scout_capture_overrun(produced, consumed, AUDIO_DMA_BLOCKS)) {
                return fail(AUDIO_OVERRUN);
            }
            if (scout_capture_pending(produced, consumed) == 0) {
                if (millis() - last_block_ms > AUDIO_STALL_TIMEOUT_MS) {
                    return fail(AUDIO_STALLED);
                }
                continue;
            }
            last_block_ms = millis();
            uint16_t *block = buffers_[consumed % AUDIO_DMA_BLOCKS];
            uint32_t remaining = expected - consumed * AUDIO_DMA_BLOCK_SAMPLES;
            uint32_t n = remaining < AUDIO_DMA_BLOCK_SAMPLES ? remaining : AUDIO_DMA_BLOCK_SAMPLES;
            scout_acoustic_feed(summary, block, n);
            scout_wav_convert(block, (int16_t *)block, n, ACOUSTIC_ADC_BITS);
            if (f.write((const uint8_t *)block, n * 2) != n * 2) {
                return fail(AUDIO_SD_WRITE_FAILED);
            }
            samples_written_ += n;
            consumed++;
            /* The block was being read while the DMA could already be refilling it. */
            if (scout_capture_overrun(produced_, consumed - 1, AUDIO_DMA_BLOCKS)) {
                return fail(AUDIO_OVERRUN);
            }
        }
        return true;
    }

    void stop() {
        TC3->COUNT16.CTRLA.bit.ENABLE = 0;
        while (TC3->COUNT16.STATUS.bit.SYNCBUSY) {}
        dma_.abort();  /* keeps the channel and ring for the next clip */
        EVSYS->USER.reg = EVSYS_USER_CHANNEL(0) | EVSYS_USER_USER(EVSYS_ID_USER_ADC_START);

        adcSync();
        ADC->CTRLA.bit.ENABLE = 0;
        adcSync();
        ADC->EVCTRL.reg = saved_evctrl_;
        ADC->REFCTRL.reg = saved_refctrl_;
        ADC->INPUTCTRL.reg = saved_inputctrl_;
        adcSync();
        ADC->AVGCTRL.reg = saved_avgctrl_;
        ADC->SAMPCTRL.reg = saved_sampctrl_;
        ADC->CTRLB.reg = saved_ctrlb_;
        adcSync();
        ADC->CTRLA.bit.ENABLE = 1;
        adcSync();
    }
};

uint16_t AudioCapture::buffers_[AUDIO_DMA_BLOCKS][AUDIO_DMA_BLOCK_SAMPLES];
volatile uint32_t AudioCapture::produced_ = 0;

#endif
