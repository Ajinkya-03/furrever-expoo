import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/constants/themes';
import { verticalScale } from '@/utils/styling';

export default function CustomTabs({ state, descriptors, navigation }: BottomTabBarProps) {

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
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.key} // Add a key for list items
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <Text style={{ color: isFocused ? colors.primary : colors.background }}>
                            {label}
                        </Text>  
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles= StyleSheet.create({
    tabBar:{
        flexDirection: 'row', 
        width: "100%", 
        height: Platform.OS == 'ios'? verticalScale(73) : verticalScale(55),
        backgroundColor: colors.green,
        alignItems:'center',
        justifyContent: 'space-between',

    }
})