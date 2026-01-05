// import React, { useState } from "react";
// import { View, FlatList } from "react-native";
// import { PetType } from "@/types";
// import Category from "./Category";
// import CategoryCard from "./CategoryCard"; //  your pet card component

// type ListByCategoryProps = {
//   pets: PetType[];
// };

// const ListByCategory: React.FC<ListByCategoryProps> = ({ pets }) => {
//   const [selectedCategory, setSelectedCategory] = useState<string>("All");

//   const filteredPets =
//     selectedCategory === "All"
//       ? pets
//       : selectedCategory === "Others"
//       ? pets.filter(
//           (p) =>
//             p.category !== "Dogs" &&
//             p.category !== "Cats" &&
//             p.category !== "Birds"
//         )
//       : pets.filter((p) => p.category === selectedCategory);

//   return (
//     <View>
//       <Category onCategorySelect={setSelectedCategory} />
//       <FlatList
//         data={filteredPets}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => <CategoryCard pet={item} />}
//       />
//     </View>
//   );
// };

// export default ListByCategory;