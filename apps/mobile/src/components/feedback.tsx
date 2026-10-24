import { FEEDBACK_KINDS, FEEDBACK_MESSAGE_MAX, feedbackMessageError, type FeedbackKind } from '@skinsense/domain';
import { Link } from 'expo-router';
import { Check, ChevronLeft, CircleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NightTint } from '@/components/night-tint';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { deviceInfo, sendFeedback } from '@/lib/feedback';

const BUTTON = 'h-[52px] items-center justify-center rounded-control px-6';

function Header() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-1 pl-2.5 pr-[18px] pt-4">
      <Link href="/settings" asChild>
        <Pressable role="button" aria-label={t('feedback.back')} className="size-11 items-center justify-center">
          <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
        </Pressable>
      </Link>
      <Text role="heading" aria-level="1" className="font-display text-[34px] font-light leading-[39px]">
        {t('feedback.title')}
      </Text>
    </View>
  );
}

// Canvas AndroidFeedback / AndroidFeedbackError; sent = AndroidFeedbackSent (a confirmation screen, not a toast).
export function Feedback() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const [kind, setKind] = useState<FeedbackKind>('bug');
  const [message, setMessage] = useState('');
  const [attach, setAttach] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'error' | 'sent'>('idle');
  const invalid = feedbackMessageError(message);
  const disabled = invalid !== null || state === 'sending';

  // Not returned to Pressable: RNTL awaits a returned promise (ticket 09).
  async function send() {
    setState('sending');
    try {
      const device = attach ? deviceInfo() : { appVersion: null, deviceNote: null };
      await sendFeedback({ kind, message: message.trim(), ...device });
      setState('sent');
    } catch {
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <View className="flex-1">
        <NightTint height={320 + top} />
        <View className="flex-1" style={{ paddingTop: top }}>
          <Header />
          <View role="status" className="my-auto items-center gap-4 px-10 pb-10">
            <View className="size-[72px] items-center justify-center rounded-pill border border-success">
              <Icon as={Check} size={30} strokeWidth={1.5} className="text-success" />
            </View>
            <Text className="text-center font-display text-[34px] font-light leading-[41px]">{t('feedback.sentTitle')}</Text>
            <Text className="text-center text-[15px] font-light leading-[23px] text-muted-foreground">{t('feedback.sentBody')}</Text>
          </View>
          <Link href="/settings" asChild>
            <Pressable role="button" className={`${BUTTON} mx-5 mb-7 border border-muted-foreground`}>
              <Text className="text-[15px] font-normal">{t('feedback.done')}</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="grow" contentContainerStyle={{ paddingTop: top }} keyboardShouldPersistTaps="handled">
      <Header />
      <View className="gap-3.5 px-5 pt-4">
        <ToggleGroup
          type="single"
          value={kind}
          onValueChange={(k) => k && setKind(k as FeedbackKind)}
          aria-label={t('feedback.kind')}
          className="flex-row rounded-control border border-border">
          {FEEDBACK_KINDS.map((k) => (
            <ToggleGroupItem
              key={k}
              value={k}
              className={`h-11 flex-1 rounded-none active:bg-transparent ${kind === k ? 'bg-primary' : 'bg-transparent'}`}>
              <Text className={`text-sm ${kind === k ? 'font-medium text-primary-foreground' : 'font-normal text-muted-foreground'}`}>{t(`feedback.${k}`)}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Text className="px-1 pt-2 text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground">{t('feedback.message')}</Text>
        <Textarea
          value={message}
          onChangeText={setMessage}
          accessibilityLabel={t('feedback.message')}
          placeholder={t('feedback.placeholder')}
          className="min-h-[200px] rounded-card border-muted-foreground bg-card px-[18px] py-4 text-[15px] font-light leading-[23px] shadow-none"
        />
        {invalid === 'tooLong' && <Text className="px-1 text-sm text-destructive">{t('feedback.tooLong', { max: FEEDBACK_MESSAGE_MAX })}</Text>}

        {/* Canvas TICK: a 22px accent circle on a 48px row, one checkbox for the whole row. */}
        <Pressable role="checkbox" aria-checked={attach} onPress={() => setAttach(!attach)} className="min-h-12 flex-row items-center gap-3.5 px-1">
          {attach ? (
            <View className="size-[22px] items-center justify-center rounded-pill bg-primary">
              <Icon as={Check} size={12} strokeWidth={2.6} className="text-primary-foreground" />
            </View>
          ) : (
            <View className="size-[22px] rounded-pill border border-foreground" />
          )}
          <Text className="flex-1 text-[14.5px] font-light">{t('feedback.attach')}</Text>
        </Pressable>
        <Text className="px-1 text-[12.5px] font-light leading-[19px] text-muted-foreground">{t('feedback.noData')}</Text>
      </View>

      <View className="mt-auto gap-3 px-5 pb-7 pt-4">
        {state === 'error' && (
          <View role="alert" accessible className="flex-row items-center justify-center gap-2">
            <Icon as={CircleAlert} size={16} strokeWidth={1.5} className="text-destructive" />
            <Text className="text-sm text-destructive">{t('feedback.error')}</Text>
          </View>
        )}
        <Pressable role="button" disabled={disabled} onPress={() => void send()} className={`${BUTTON} bg-primary ${disabled ? 'opacity-50' : ''}`}>
          <Text className="text-[15px] font-medium text-primary-foreground">{t('feedback.send')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
