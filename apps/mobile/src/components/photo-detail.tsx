import { NOTE_MAX, noteError, reddestReading, TAG_MAX, tagError } from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { LoadState } from '@/components/load-state';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { addTag, deletePhoto, loadPhotoDetail, removeTag, saveNote, type PhotoDetailData } from '@/lib/history';

// Same data and copy as apps/web/src/components/photo-detail.tsx; layout from AndroidPhoto:
// reading, Note card, Tags, actions. Ticket 17 adds the share icon in the header.
const CARD = 'rounded-card border border-border bg-card';
const LABEL = 'text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';
const BUTTON = 'h-12 flex-1 flex-row items-center justify-center gap-2.5 rounded-control px-3';

const usePalette = () => color[useColorScheme() === 'dark' ? 'dark' : 'light'];

// Canvas AndroidPhotoDelete, with the deleting and error states of DeleteAccountRow (settings.tsx):
// the dialog stays open while deleting and on failure.
function DeletePhoto({ photo, night }: { photo: PhotoDetailData; night: string }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'deleting' | 'error'>('idle');
  const deleting = state === 'deleting';

  async function confirm() {
    setState('deleting');
    try {
      await deletePhoto(photo);
    } catch {
      return setState('error');
    }
    router.replace('/history');
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (deleting) return;
        setOpen(next);
        if (!next) setState('idle');
      }}>
      <AlertDialogTrigger asChild>
        <Pressable className="min-h-11 flex-row items-center px-2">
          <Text className="text-[15px] text-destructive">{t('history.delete')}</Text>
        </Pressable>
      </AlertDialogTrigger>
      <AlertDialogContent className="gap-3.5 rounded-card border-border bg-surface-2 p-6">
        <AlertDialogTitle className="font-display text-[28px] font-normal leading-[34px]">{t('history.deleteTitle')}</AlertDialogTitle>
        <AlertDialogDescription className="text-[15px] font-light leading-[23px] text-foreground">{t('history.deleteBody', { date: night })}</AlertDialogDescription>
        {state === 'error' && (
          <View role="alert" accessible>
            <Text className="text-sm text-destructive">{t('history.deleteError')}</Text>
          </View>
        )}
        <View className="flex-row gap-2.5 pt-2">
          <AlertDialogCancel disabled={deleting} className={`${BUTTON} border border-muted-foreground bg-transparent shadow-none ${deleting ? 'opacity-40' : ''}`}>
            <Text className="text-[15px] font-normal text-foreground">{t('history.cancel')}</Text>
          </AlertDialogCancel>
          {/* Not AlertDialogAction: the primitive closes the dialog before onPress runs. */}
          <Pressable role="button" disabled={deleting} onPress={() => void confirm()} className={`${BUTTON} bg-destructive ${deleting ? 'opacity-80' : ''}`}>
            {deleting && <ActivityIndicator size="small" color={palette['on-accent']} />}
            <Text className="text-[15px] font-medium text-destructive-foreground">{deleting ? t('history.deleting') : t('history.delete')}</Text>
          </Pressable>
        </View>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ErrorLine({ children }: { children: string }) {
  return (
    <View role="alert" accessible>
      <Text className="text-sm text-destructive">{children}</Text>
    </View>
  );
}

// Saved when the field loses focus, only if valid and changed.
function NoteCard({ photo }: { photo: PhotoDetailData }) {
  const { t } = useTranslation();
  const [note, setNote] = useState(photo.note ?? '');
  const [saved, setSaved] = useState(photo.note ?? '');
  const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle');
  const tooLong = noteError(note) === 'tooLong';

  async function save() {
    if (tooLong || note.trim() === saved.trim()) return;
    try {
      await saveNote(photo.id, note);
      setSaved(note);
      setState('saved');
    } catch {
      setState('error');
    }
  }

  return (
    <View className={`mt-3.5 gap-2.5 px-[18px] py-4 ${CARD}`}>
      <View className="flex-row items-center justify-between">
        <Text className={LABEL}>{t('history.note')}</Text>
        {state === 'saved' && (
          <Text role="status" className="text-xs font-light text-muted-foreground">
            {t('history.noteSaved')}
          </Text>
        )}
      </View>
      <Textarea
        value={note}
        onChangeText={(value) => {
          setNote(value);
          setState('idle');
        }}
        onBlur={() => void save()}
        accessibilityLabel={t('history.note')}
        aria-invalid={tooLong}
        placeholder={t('history.notePlaceholder')}
        className="min-h-[52px] border-0 bg-transparent p-0 text-[15px] font-light leading-[23px] shadow-none dark:bg-transparent"
      />
      {tooLong && <ErrorLine>{t('history.noteTooLong', { max: NOTE_MAX })}</ErrorLine>}
      {state === 'error' && <ErrorLine>{t('history.noteError')}</ErrorLine>}
    </View>
  );
}

const CHIP = 'h-11 flex-row items-center rounded-control border border-border';

// Canvas .chip Tags with a 44px remove target; "Thêm tag" turns into an input (the keyboard's submit adds).
function Tags({ photo }: { photo: PhotoDetailData }) {
  const { t } = useTranslation();
  const [tags, setTags] = useState(photo.tags);
  const [draft, setDraft] = useState<string | null>(null); // null: not adding
  const [error, setError] = useState<'empty' | 'tooLong' | 'duplicate' | 'failed' | null>(null);
  const messages = {
    empty: t('history.tagEmpty'),
    tooLong: t('history.tagTooLong', { max: TAG_MAX }),
    duplicate: t('history.tagDuplicate'),
    failed: t('history.tagError'),
  };

  async function add(label: string) {
    const invalid = tagError(label, tags.map((tag) => tag.label));
    if (invalid) return setError(invalid);
    try {
      const tag = await addTag(photo.id, label);
      setTags((current) => [...current, tag]);
      setDraft(null);
      setError(null);
    } catch {
      setError('failed');
    }
  }

  async function remove(id: string) {
    try {
      await removeTag(id);
      setTags((current) => current.filter((tag) => tag.id !== id));
      setError(null);
    } catch {
      setError('failed');
    }
  }

  return (
    <View className="mt-4 gap-2.5">
      <Text className={LABEL}>{t('history.tags')}</Text>
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <View key={tag.id} className={`${CHIP} pl-3.5`}>
            <Text className="text-sm">{tag.label}</Text>
            <Pressable role="button" aria-label={t('history.removeTag', { label: tag.label })} onPress={() => void remove(tag.id)} className="size-11 items-center justify-center">
              <Icon as={X} size={15} strokeWidth={1.5} className="text-foreground" />
            </Pressable>
          </View>
        ))}
        {draft === null ? (
          <Pressable role="button" onPress={() => setDraft('')} className={`${CHIP} gap-1.5 border-dashed px-4`}>
            <Icon as={Plus} size={15} strokeWidth={1.5} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">{t('history.addTag')}</Text>
          </Pressable>
        ) : (
          <Input
            autoFocus
            accessibilityLabel={t('history.newTag')}
            aria-invalid={error !== null && error !== 'failed'}
            placeholder={t('history.newTag')}
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              setError(null);
            }}
            submitBehavior="submit"
            onSubmitEditing={() => void add(draft)}
            onBlur={() => !draft.trim() && (setDraft(null), setError(null))}
            className={`${CHIP} w-44 px-3.5 text-sm shadow-none`}
          />
        )}
      </View>
      {error && <ErrorLine>{messages[error]}</ErrorLine>}
    </View>
  );
}

export function PhotoDetail({ photoId }: { photoId: string }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const [photo, setPhoto] = useState<PhotoDetailData | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    loadPhotoDetail(photoId).then(
      (loaded) => !cancelled && setPhoto(loaded),
      () => !cancelled && setPhoto(null),
    );
    return () => {
      cancelled = true;
    };
  }, [photoId, attempt]);

  const taken = photo ? new Date(photo.taken_at) : undefined;
  const night = taken?.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  // Date and time formatted apart, so Vietnamese keeps the canvas order "13 thg 9, 22:14".
  const title = taken && `${night}, ${taken.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}`;
  // The reddest zone: the one reading worth a glance on a single night.
  const reading = photo && reddestReading(photo.readings);

  return (
    <ScrollView contentContainerClassName="flex-grow px-5 pb-7 pt-4">
      <View className="-ml-2.5 flex-row items-center gap-1">
        <Link href="/history" asChild>
          <Pressable role="button" aria-label={t('history.back')} className="size-11 items-center justify-center">
            <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
          </Pressable>
        </Link>
        <Text role="heading" aria-level="1" className="flex-1 font-display text-[30px] font-light leading-[35px]">
          {title}
        </Text>
      </View>

      {photo === undefined && <LoadState failed={false} onRetry={retry} />}
      {photo === null && (
        <LoadState
          failed
          onRetry={() => {
            setPhoto(undefined);
            retry();
          }}
        />
      )}
      {photo && (
        <>
          <View className="mt-3 h-[320px] overflow-hidden rounded-card">
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} aria-hidden>
              <Defs>
                <LinearGradient id="photo" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={palette['photo-b']} />
                  <Stop offset="1" stopColor={palette['photo-a']} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#photo)" />
            </Svg>
            {photo.url && <Image accessible={false} source={{ uri: photo.url }} style={[StyleSheet.absoluteFill, styles.mirrored]} contentFit="cover" />}
            {/* Canvas bg 60% over the photo: hex alpha, as in trends.tsx. */}
            <View className="absolute right-3 top-3 rounded-pill px-2.5 py-1" style={{ backgroundColor: `${palette.bg}99` }}>
              <Text className="text-xs font-medium">{t('history.spots', { count: photo.spotCount })}</Text>
            </View>
          </View>

          {reading && (
            <View className={`mt-3.5 px-[18px] py-4 ${CARD}`}>
              <Text className={LABEL}>{t('history.redness', { zone: t(`capture.zones.${reading.zone}`) })}</Text>
              <Text className="font-display text-[44px] font-light leading-[50px]">{reading.redness.toFixed(1)}</Text>
            </View>
          )}

          <NoteCard photo={photo} />
          <Tags photo={photo} />

          <View className="mt-auto flex-row items-center justify-between gap-3 pt-5">
            <Link href={`/spots/${photo.id}`} asChild>
              <Pressable role="button" className="h-[52px] flex-1 items-center justify-center rounded-control border border-muted-foreground px-6">
                <Text className="text-[15px]">{t('history.markSpots')}</Text>
              </Pressable>
            </Link>
            <DeletePhoto photo={photo} night={night!} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ mirrored: { transform: [{ scaleX: -1 }] } });
