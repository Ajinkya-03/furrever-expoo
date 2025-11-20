import { colors, spacingY } from "@/constants/themes";
import { verticalScale } from "@/utils/styling";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Icons from "phosphor-react-native";
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
export default function CustomTabs({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const tabbarIcons: any = {
    index: (isFocused: boolean) => (
            <Icons.House
                size={verticalScale(30)}
                weight={isFocused ? "fill" : "regular"}
                color={isFocused ? colors.primary : colors.background}
            />
        ),
    favourite: (isFocused: boolean) => (
        <Icons.Heart
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.background}
        />
        ),
    inbox: (isFocused: boolean) => (
        <Icons.Chat
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.background}
        />
        ),
    profile: (isFocused: boolean) => (
        <Icons.User
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.background}
        />
        ),
    };

return (
    <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label: any =
                options.tabBarLabel !== undefined
                    ? options.tabBarLabel
                    : options.title !== undefined
                        ? options.title
                        : route.name;
            const isFocused = state.index === index;
            const onPress = () => {
                const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                }
            };

            const onLongPress = () => {
                navigation.emit({
                    type: "tabLongPress",
                    target: route.key,
                });
            };

            return (
                <TouchableOpacity
                    key={route.name} // Add a key for list items
                    accessibilityState={isFocused ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    testID={options.tabBarButtonTestID}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={styles.tabBarItem}
                >
                    {
                        tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)
                    }
                </TouchableOpacity>
            );
        })}
    </View>
);
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: "row",
        width: "100%",
        height: Platform.OS == "ios" ? verticalScale(73) : verticalScale(70),
        backgroundColor: colors.green,
        alignItems: "center",
        justifyContent: "space-around",
        borderTopColor: colors.primary,
        borderTopWidth: 1,
    },
    tabBarItem: {
        marginBottom: Platform.OS == "ios" ? spacingY._10 : spacingY._5,
        justifyContent: "center",
        alignItems: "center",
    },
});
