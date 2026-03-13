/*
  File: app/Status.tsx
  Purpose: WhatsApp-like Status Screen with text + photo status + caption + pause on hold
*/

import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { BottomNav, TopBar } from "./Home";

const API_BASE = "https://unresources.cravii.ng/api";

const T = {
  bg: "#08080F",
  bgDeep: "#000000",
  card: "#0F0F1C",
  border: "#1C1C30",
  white: "#FFFFFF",
  whiteSoft: "#E5E5F0",
  whiteMuted: "#A0A0B8",
  faint: "#4B4B6B",
  purpleGlow: "#9B7EFF",
  purpleMid: "#6B2ED9",
  purpleFaint: "#2A1A4D",
  online: "#22D3A0",
  navBg: "#0A0A16",
  statusBar: "light-content" as const,
};

type Story = {
  id: number;
  type: "text" | "image";
  content?: string;
  media_url?: string;
  background_color?: string;
  created_at: string;
  seen?: boolean;
};

type StatusUser = {
  user_id: number;
  name: string;
  username: string;
  initials?: string;
  color?: string;
  avatar?: string;
  seen: boolean;
  stories: Story[];
};

function IconPlus({
  color = "#fff",
  size = 11,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconCamera({
  color = T.whiteMuted,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function IconText({
  color = T.whiteMuted,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(dateString: string) {
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusRow({
  status,
  onPress,
}: {
  status: StatusUser;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.statusRow}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[s.ring, status.seen ? s.ringSeen : s.ringUnseen]}>
        <View
          style={[
            s.ringInner,
            { backgroundColor: status.color || T.purpleMid },
          ]}
        >
          <Text style={s.ringText}>
            {status.initials || getInitials(status.name)}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={s.statusName}>{status.name}</Text>
        <Text style={s.statusTime}>
          {status.stories.length > 0
            ? timeAgo(status.stories[0].created_at)
            : "No update"}
        </Text>
      </View>

      {!status.seen ? <View style={s.unseenDot} /> : null}
    </TouchableOpacity>
  );
}

export default function Status() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statuses, setStatuses] = useState<StatusUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const progressValueRef = useRef(0);

  useEffect(() => {
    const sub = progress.addListener(({ value }) => {
      progressValueRef.current = value;
    });
    return () => {
      progress.removeListener(sub);
    };
  }, [progress]);

  const loadStatuses = async (userId: number | string) => {
    try {
      const res = await fetch(
        `${API_BASE}/get_statuses.php?viewer_id=${encodeURIComponent(String(userId))}`,
      );
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.status === "success") {
        setStatuses(data.statuses || []);
      }
    } catch (err) {
      console.log("Status load error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await SecureStore.getItemAsync("user");
        if (stored) {
          const user = JSON.parse(stored);
          setCurrentUser(user);

          if (user?.id) {
            await loadStatuses(user.id);
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const resetComposer = () => {
    setStatusText("");
    setSelectedImageUri("");
    setUploadedImageUrl("");
    setUploadingImage(false);
  };

  const pickImageStatus = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow gallery access to pick a photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [9, 16],
    });

    if (result.canceled) return;

    const image = result.assets[0];
    setSelectedImageUri(image.uri);
    await uploadImageStatus(image.uri);
  };

  const uploadImageStatus = async (uri: string) => {
    try {
      setUploadingImage(true);

      const form = new FormData();
      form.append("image", {
        uri,
        name: `status_${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_BASE}/upload_status_image.php`, {
        method: "POST",
        body: form,
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.status === "success") {
        setUploadedImageUrl(data.url);
        setAddModalVisible(true);
      } else {
        Alert.alert("Upload failed", data.message || "Could not upload image");
      }
    } catch (err) {
      Alert.alert("Upload failed", "Network error while uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addStatus = async () => {
    if (!currentUser?.id) {
      Alert.alert("Error", "No logged-in user found");
      return;
    }

    const isImageStatus = !!uploadedImageUrl;

    if (!isImageStatus && !statusText.trim()) {
      Alert.alert("Error", "Please type a status");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/add_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          type: isImageStatus ? "image" : "text",
          content: statusText.trim(),
          media_url: uploadedImageUrl,
          background_color: T.purpleMid,
        }),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.status === "success") {
        resetComposer();
        setAddModalVisible(false);
        await loadStatuses(currentUser.id);
      } else {
        Alert.alert("Error", data.message || "Failed to add status");
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    }
  };

  const markViewed = async (storyId: number) => {
    if (!currentUser?.id) return;

    try {
      await fetch(`${API_BASE}/view_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_id: storyId,
          viewer_id: currentUser.id,
        }),
      });
    } catch (err) {
      console.log("View status error:", err);
    }
  };

  const startProgress = (fromValue = 0) => {
    progress.setValue(fromValue);
    const remaining = Math.max(100, (1 - fromValue) * 4000);

    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished && !isPaused) {
        nextStory();
      }
    });
  };

  const pauseProgress = () => {
    if (!viewerVisible) return;
    setIsPaused(true);
    if (animationRef.current) {
      animationRef.current.stop();
    }
  };

  const resumeProgress = () => {
    if (!viewerVisible) return;
    setIsPaused(false);
    startProgress(progressValueRef.current);
  };

  const openViewer = async (index: number) => {
    setStatusIndex(index);
    setStoryIndex(0);
    setViewerVisible(true);
    setIsPaused(false);

    const firstStory = statuses[index]?.stories?.[0];
    if (firstStory?.id) {
      await markViewed(firstStory.id);
    }

    startProgress(0);
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setIsPaused(false);
    if (animationRef.current) {
      animationRef.current.stop();
    }
    progress.setValue(0);
  };

  const nextStory = async () => {
    const currentStatus = statuses[statusIndex];
    if (!currentStatus) return;

    if (storyIndex < currentStatus.stories.length - 1) {
      const newIndex = storyIndex + 1;
      setStoryIndex(newIndex);

      const story = currentStatus.stories[newIndex];
      if (story?.id) {
        await markViewed(story.id);
      }

      startProgress(0);
    } else if (statusIndex < statuses.length - 1) {
      const nextStatusIndex = statusIndex + 1;
      setStatusIndex(nextStatusIndex);
      setStoryIndex(0);

      const story = statuses[nextStatusIndex]?.stories?.[0];
      if (story?.id) {
        await markViewed(story.id);
      }

      startProgress(0);
    } else {
      closeViewer();
      if (currentUser?.id) {
        await loadStatuses(currentUser.id);
      }
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      startProgress(0);
    } else if (statusIndex > 0) {
      const prevStatusIndex = statusIndex - 1;
      const prevStatus = statuses[prevStatusIndex];
      const lastStoryIndex = prevStatus.stories.length - 1;

      setStatusIndex(prevStatusIndex);
      setStoryIndex(lastStoryIndex);
      startProgress(0);
    }
  };

  const myStatuses = statuses.filter(
    (st) => String(st.user_id) === String(currentUser?.id),
  );
  const otherStatuses = statuses.filter(
    (st) => String(st.user_id) !== String(currentUser?.id),
  );

  const recent = otherStatuses.filter((st) => !st.seen);
  const viewed = otherStatuses.filter((st) => st.seen);

  const currentStatus = statuses[statusIndex];
  const currentStory = currentStatus?.stories?.[storyIndex];
  const myLatestTime =
    myStatuses.length > 0 && myStatuses[0].stories.length > 0
      ? timeAgo(myStatuses[0].stories[0].created_at)
      : "";

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={T.bg} />
        <ActivityIndicator
          size="large"
          color={T.purpleGlow}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <View style={{ paddingTop: Platform.OS === "android" ? 2 : 0 }}>
        <TopBar
          username={currentUser?.username || ""}
          theme="dark"
          onThemeChange={() => {}}
          T={T}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        <TouchableOpacity
          style={s.myCard}
          activeOpacity={0.85}
          onPress={() => {
            if (myStatuses.length > 0) {
              const myIndex = statuses.findIndex(
                (st) => String(st.user_id) === String(currentUser?.id),
              );
              if (myIndex >= 0) openViewer(myIndex);
            } else {
              resetComposer();
              setAddModalVisible(true);
            }
          }}
        >
          <View style={s.myAvatarWrap}>
            <View style={s.myAvatar}>
              <Text style={s.myAvatarText}>
                {currentUser?.initials ||
                  getInitials(
                    currentUser?.name || currentUser?.username || "U",
                  )}
              </Text>
            </View>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => {
                resetComposer();
                setAddModalVisible(true);
              }}
            >
              <IconPlus />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.myName}>My Status</Text>
            <Text style={s.mySub}>
              {myStatuses.length > 0
                ? `Tap to view • ${myLatestTime}`
                : "Tap + to add a text or photo update"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => {
              resetComposer();
              setAddModalVisible(true);
            }}
          >
            <View style={s.actionIcon}>
              <IconText />
            </View>
            <Text style={s.actionLabel}>Text Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={pickImageStatus}
            disabled={uploadingImage}
          >
            <View style={s.actionIcon}>
              <IconCamera />
            </View>
            <Text style={s.actionLabel}>
              {uploadingImage ? "Uploading..." : "Photo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {recent.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>RECENT UPDATES</Text>
            {recent.map((st) => {
              const realIndex = statuses.findIndex(
                (x) => x.user_id === st.user_id,
              );
              return (
                <StatusRow
                  key={String(st.user_id)}
                  status={st}
                  onPress={() => openViewer(realIndex)}
                />
              );
            })}
          </>
        ) : null}

        {viewed.length > 0 ? (
          <>
            <View style={s.divider} />
            <Text style={s.sectionLabel}>VIEWED</Text>
            {viewed.map((st) => {
              const realIndex = statuses.findIndex(
                (x) => x.user_id === st.user_id,
              );
              return (
                <StatusRow
                  key={String(st.user_id)}
                  status={st}
                  onPress={() => openViewer(realIndex)}
                />
              );
            })}
          </>
        ) : null}

        {recent.length === 0 && viewed.length === 0 ? (
          <Text style={s.emptyText}>No status updates yet</Text>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={addModalVisible}
        animationType="fade"
        onRequestClose={() => {
          setAddModalVisible(false);
          resetComposer();
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setAddModalVisible(false);
            resetComposer();
          }}
        >
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>
                  {uploadedImageUrl ? "Add Photo Status" : "Add Status"}
                </Text>

                {selectedImageUri ? (
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={s.previewImage}
                    resizeMode="cover"
                  />
                ) : null}

                <TextInput
                  style={[
                    s.statusInput,
                    selectedImageUri ? s.statusInputSmall : null,
                  ]}
                  placeholder={
                    selectedImageUri
                      ? "Write a caption (optional)"
                      : "What's on your mind?"
                  }
                  placeholderTextColor={T.faint}
                  value={statusText}
                  onChangeText={setStatusText}
                  multiline
                  maxLength={300}
                />

                <View style={s.modalButtons}>
                  <TouchableOpacity
                    style={s.modalCancel}
                    onPress={() => {
                      setAddModalVisible(false);
                      resetComposer();
                    }}
                  >
                    <Text style={s.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.modalPost} onPress={addStatus}>
                    <Text style={s.modalPostText}>
                      {uploadedImageUrl ? "Post Photo" : "Post Status"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={viewerVisible}
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <View
          style={[
            s.viewer,
            {
              backgroundColor:
                currentStory?.type === "image"
                  ? "#000"
                  : currentStory?.background_color || T.bgDeep,
            },
          ]}
        >
          <View style={s.progressWrap}>
            {(currentStatus?.stories || []).map((_, i) => {
              const isActive = i === storyIndex;
              const isPassed = i < storyIndex;

              return (
                <View key={i} style={s.progressBar}>
                  {isPassed ? (
                    <View style={s.progressFillFull} />
                  ) : isActive ? (
                    <Animated.View
                      style={[
                        s.progressFillAnimated,
                        {
                          width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={s.viewerHeader}>
            <Text style={s.viewerName}>{currentStatus?.name}</Text>
            <Text style={s.viewerTime}>
              {currentStory?.created_at ? timeAgo(currentStory.created_at) : ""}
            </Text>
          </View>

          <View style={s.viewerCenter}>
            {currentStory?.type === "image" && currentStory?.media_url ? (
              <>
                <Image
                  source={{ uri: currentStory.media_url }}
                  style={s.viewerImage}
                  resizeMode="contain"
                />
                {currentStory?.content ? (
                  <View style={s.captionWrap}>
                    <Text style={s.viewerCaption}>{currentStory.content}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={s.viewerText}>{currentStory?.content || ""}</Text>
            )}
          </View>

          <View style={s.touchAreas}>
            <Pressable
              style={{ flex: 1 }}
              onPress={prevStory}
              onLongPress={pauseProgress}
              onPressOut={resumeProgress}
              delayLongPress={150}
            />
            <Pressable
              style={{ flex: 1 }}
              onPress={nextStory}
              onLongPress={pauseProgress}
              onPressOut={resumeProgress}
              delayLongPress={150}
            />
          </View>

          <TouchableOpacity style={s.closeArea} onPress={closeViewer}>
            <Text style={s.closeText}>×</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <BottomNav active="status" T={T} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },

  myCard: {
    margin: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(109,40,217,0.15)",
    borderWidth: 1,
    borderColor: "rgba(109,40,217,0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  myAvatarWrap: {
    position: "relative",
  },

  myAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: T.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.4)",
  },

  myAvatarText: {
    color: T.white,
    fontSize: 22,
    fontWeight: "800",
  },

  addBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.purpleGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: T.bg,
  },

  myName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.white,
  },

  mySub: {
    fontSize: 12,
    color: T.faint,
    marginTop: 2,
  },

  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 4,
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 14,
  },

  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(109,40,217,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: T.whiteSoft,
  },

  divider: {
    height: 1,
    backgroundColor: T.border,
    marginHorizontal: 20,
    marginVertical: 10,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: T.faint,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },

  ring: {
    width: 56,
    height: 56,
    borderRadius: 17,
    padding: 2.5,
  },

  ringUnseen: {
    backgroundColor: T.purpleMid,
  },

  ringSeen: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  ringInner: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  ringText: {
    color: T.white,
    fontWeight: "700",
    fontSize: 14,
  },

  statusName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.whiteSoft,
  },

  statusTime: {
    fontSize: 12,
    color: T.faint,
    marginTop: 2,
  },

  unseenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.purpleGlow,
  },

  emptyText: {
    color: T.faint,
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    padding: 18,
  },

  modalTitle: {
    color: T.white,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },

  previewImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: T.bgDeep,
  },

  statusInput: {
    minHeight: 120,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 14,
    color: T.white,
    textAlignVertical: "top",
    fontSize: 15,
  },

  statusInputSmall: {
    minHeight: 90,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },

  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
  },

  modalCancelText: {
    color: T.white,
    fontWeight: "700",
  },

  modalPost: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: T.purpleMid,
  },

  modalPostText: {
    color: "#fff",
    fontWeight: "800",
  },

  viewer: {
    flex: 1,
  },

  progressWrap: {
    position: "absolute",
    top: 50,
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },

  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFillFull: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },

  progressFillAnimated: {
    height: "100%",
    backgroundColor: "#fff",
  },

  viewerHeader: {
    position: "absolute",
    top: 62,
    left: 18,
    right: 18,
    zIndex: 11,
  },

  viewerName: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  viewerTime: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    marginTop: 2,
  },

  viewerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  viewerText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 38,
    textAlign: "center",
    fontWeight: "700",
  },

  viewerImage: {
    width: "100%",
    height: "78%",
  },

  captionWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 34,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },

  viewerCaption: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 22,
  },

  touchAreas: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
  },

  closeArea: {
    position: "absolute",
    top: 38,
    right: 14,
    zIndex: 12,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 28,
  },
});
