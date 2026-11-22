import * as Haptics from 'expo-haptics';
import { MessageSquare, Send, Store, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  loadCustomerChatRemote,
  sendChatMessageRemote,
  type ChatMessageRemote,
} from '@/lib/api';

const QUICK_PROMPTS = [
  'Sản phẩm này có dùng cho da dầu mụn được không?',
  'Kiểm tra giúp mình trạng thái đơn hàng nhé.',
  'Shop tư vấn giúp mình cách kết hợp routine Sáng/Tối.',
];

/**
 * Native Customer <-> Shop live chat bottom sheet powered by `/api/chat`.
 */
export function ShopChatModal({
  visible,
  onClose,
  shopId,
  shopName,
  orderCode,
}: {
  visible: boolean;
  onClose: () => void;
  shopId?: string;
  shopName?: string;
  orderCode?: string;
}) {
  const targetShopId = (shopId || shopName || 'skinsense_mall')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'skinsense_mall';

  const [messages, setMessages] = useState<ChatMessageRemote[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    const res = await loadCustomerChatRemote(targetShopId).catch(() => null);
    if (res?.ok && res.data?.ok && res.data.thread) {
      setMessages(Array.isArray(res.data.thread.messages) ? res.data.thread.messages : []);
      setErrorMsg(null);
    } else if (res?.status === 401) {
      setErrorMsg('Vui lòng đăng nhập tài khoản để nhắn tin trực tiếp với Gian hàng.');
    }
  }, [targetShopId]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    void loadThread().finally(() => setLoading(false));
    const timer = setInterval(() => {
      void loadThread();
    }, 3500);
    return () => clearInterval(timer);
  }, [visible, loadThread]);

  async function handleSend(customText?: string) {
    const text = (customText ?? inputText).trim();
    if (!text || sending) return;
    setSending(true);
    setErrorMsg(null);
    if (!customText) setInputText('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const res = await sendChatMessageRemote({
      shopId: targetShopId,
      shopName: shopName || 'SkinSense Official',
      orderCode,
      sender: 'user',
      text,
    }).catch(() => null);

    setSending(false);
    if (!res?.ok || !res.data?.ok) {
      if (!customText) setInputText(text);
      setErrorMsg(res?.data?.error || 'Không thể gửi tin nhắn lúc này.');
      return;
    }

    if (res.data.thread?.messages) {
      setMessages(res.data.thread.messages);
    } else {
      await loadThread();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/75"
      >
        <View className="h-[80%] rounded-t-3xl border-t border-border bg-card p-4 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border pb-3">
            <View className="flex-1 flex-row items-center gap-2.5">
              <View className="size-9 items-center justify-center rounded-pill bg-primary/15">
                <Icon as={Store} size={17} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
                  {shopName || 'SkinSense Official'}
                </Text>
                <Text className="text-[11px] text-muted-foreground">
                  {orderCode ? `Trao đổi về đơn ${orderCode}` : 'Hỗ trợ tư vấn trực tuyến'}
                </Text>
              </View>
            </View>
            <Pressable
              role="button"
              accessibilityLabel="Đóng hộp thoại"
              onPress={onClose}
              className="size-8 items-center justify-center rounded-full bg-surface-2"
            >
              <Icon as={X} size={17} className="text-muted-foreground" />
            </Pressable>
          </View>

          {errorMsg && (
            <View className="mt-2 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2">
              <Text className="text-[12px] text-destructive">{errorMsg}</Text>
            </View>
          )}

          {/* Messages */}
          <ScrollView className="flex-1 py-3" contentContainerClassName="gap-2.5">
            {loading ? (
              <View className="items-center py-8">
                <ActivityIndicator />
                <Text className="mt-2 text-[12px] text-muted-foreground">Đang tải cuộc trò chuyện...</Text>
              </View>
            ) : messages.length === 0 ? (
              <View className="items-center gap-2 py-8 px-4">
                <Icon as={MessageSquare} size={28} className="text-muted-foreground" />
                <Text className="text-center text-[13px] font-medium text-foreground">
                  Bắt đầu trò chuyện với {shopName || 'Gian hàng'}
                </Text>
                <View className="mt-2 w-full gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => void handleSend(q)}
                      className="rounded-control border border-border bg-surface-2 px-3 py-2"
                    >
                      <Text className="text-[12px] text-foreground">{q}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    className={`max-w-[82%] rounded-card px-3.5 py-2.5 ${
                      isMine
                        ? 'self-end bg-primary'
                        : 'self-start border border-border bg-surface-2'
                    }`}
                  >
                    {!isMine && msg.senderName ? (
                      <Text className="mb-0.5 text-[10.5px] font-semibold text-primary">
                        {msg.senderName}
                      </Text>
                    ) : null}
                    <Text
                      className={`text-[13px] leading-5 ${
                        isMine ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      className={`mt-1 text-[10px] ${
                        isMine ? 'text-primary-foreground/75 text-right' : 'text-muted-foreground'
                      }`}
                    >
                      {msg.time}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Composer */}
          <View className="flex-row items-center gap-2 border-t border-border pt-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn gửi Gian hàng..."
              placeholderTextColor="#888"
              className="flex-1 min-h-11 rounded-control border border-border bg-surface-2 px-3.5 py-2 text-[13px] text-foreground"
            />
            <Pressable
              role="button"
              accessibilityLabel="Gửi tin nhắn"
              disabled={sending || !inputText.trim()}
              onPress={() => void handleSend()}
              className="size-11 items-center justify-center rounded-control bg-primary disabled:opacity-45"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon as={Send} size={17} className="text-primary-foreground" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
