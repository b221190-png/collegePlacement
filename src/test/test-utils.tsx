import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export const renderWithRouter = (
  ui: React.ReactElement,
  { route = '/', ...options }: RenderWithRouterOptions = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>,
    ...options,
  });
};

interface RouteDefinition {
  path: string;
  element: React.ReactElement;
}

export const renderRoutes = (routes: RouteDefinition[], initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </MemoryRouter>
  );
};
