import { Text, type TextProps } from 'react-native';

type IconProps = TextProps & {
  name: string;
};

export function Ionicons({ name, ...rest }: IconProps) {
  return <Text {...rest}>{name}</Text>;
}

export default Ionicons;
