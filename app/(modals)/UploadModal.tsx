import React from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { colors, radius, spacingY } from "@/constants/themes";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import { verticalScale } from "@/utils/styling";
import { UploadModalProps } from "@/types";

const UploadModal: React.FC<UploadModalProps> = ({
    modalVisible,
    onBackPress,
    onCameraPress,
    onGalleryPress,
    onRemovePress,
    isLoading = false,
}) => {
    return (
        <Modal animationType="slide" visible={modalVisible} transparent>
            <TouchableOpacity
                style={styles.container}
                onPress={onBackPress}
                activeOpacity={1}
            >
                {isLoading ? (
                    <ActivityIndicator size={70} color={colors.primary} />
                ) : (
                    <View style={styles.modalView}>
                        <Typo style={styles.title}>Profile Photo</Typo>
                        <View style={styles.decisionRow}>
                            <TouchableOpacity style={styles.optionBtn} onPress={onCameraPress}>
                                <Icons.Camera
                                    size={verticalScale(26)}
                                    color={colors.green}
                                    weight="fill"
                                />
                                <Typo>Camera</Typo>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionBtn} onPress={onGalleryPress}>
                                <Icons.Image
                                    size={verticalScale(26) }
                                    color={colors.green}
                                    weight="fill"
                                />
                                <Typo>Gallery</Typo>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.optionBtn} onPress={onRemovePress}>
                                <Icons.Trash size={verticalScale(26)} color={colors.green} weight="fill" />
                                <Typo>Remove</Typo>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </Modal>
    );
};

export default UploadModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalView: {
        backgroundColor: colors.background,
        borderRadius: radius._17,
        padding: spacingY._20,
        width: "80%",
        alignItems: "center",
    },
    title: {
        marginBottom: spacingY._10,
        fontSize: verticalScale(18),
        fontWeight: "700",
    },
    decisionRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: spacingY._10,
    },
    optionBtn: {
        alignItems: "center",
        gap: spacingY._5,
    },
});
